/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { pick, throttle, cloneDeep } from 'lodash';
import { resolve as resolveUrl } from 'url';
import type { PublicMethodsOf } from '@osd/utility-types';

import {
  SavedObject,
  SavedObjectReference,
  SavedObjectsClientContract as SavedObjectsApi,
  SavedObjectsFindOptions as SavedObjectFindOptionsServer,
  SavedObjectsMigrationVersion,
  SavedObjectsBaseOptions,
} from '../../server';

import { SimpleSavedObject } from './simple_saved_object';
import { HttpFetchOptions, HttpSetup, PrependOptions } from '../http';

type SavedObjectsFindOptions = Omit<
  SavedObjectFindOptionsServer,
  | 'sortOrder'
  | 'rootSearchFields'
  | 'typeToNamespacesMap'
  | 'ACLSearchParams'
  | 'workspacesSearchOperator'
>;

type PromiseType<T extends Promise<any>> = T extends Promise<infer U> ? U : never;

/** @public */
export interface SavedObjectsCreateOptions {
  /**
   * (Not recommended) Specify an id instead of having the saved objects service generate one for you.
   */
  id?: string;
  /** If a document with the given `id` already exists, overwrite it's contents (default=false). */
  overwrite?: boolean;
  /** {@inheritDoc SavedObjectsMigrationVersion} */
  migrationVersion?: SavedObjectsMigrationVersion;
  references?: SavedObjectReference[];
  workspaces?: SavedObjectsBaseOptions['workspaces'];
}

/**
 * @param type - Create a SavedObject of the given type
 * @param attributes - Create a SavedObject with the given attributes
 *
 * @public
 */
export interface SavedObjectsBulkCreateObject<T = unknown> extends SavedObjectsCreateOptions {
  type: string;
  attributes: T;
}

/** @public */
export interface SavedObjectsBulkCreateOptions {
  /** If a document with the given `id` already exists, overwrite it's contents (default=false). */
  overwrite?: boolean;
  workspaces?: SavedObjectsCreateOptions['workspaces'];
}

/** @public */
export interface SavedObjectsBulkUpdateObject<T = unknown> {
  type: string;
  id: string;
  attributes: T;
  version?: string;
  references?: SavedObjectReference[];
}

/** @public */
export interface SavedObjectsBulkUpdateOptions {
  namespace?: string;
}

/** @public */
export interface SavedObjectsUpdateOptions {
  version?: string;
  /** {@inheritDoc SavedObjectsMigrationVersion} */
  migrationVersion?: SavedObjectsMigrationVersion;
  references?: SavedObjectReference[];
}

/** @public */
export interface SavedObjectsBatchResponse<T = unknown> {
  savedObjects: Array<SimpleSavedObject<T>>;
}

/** @public */
export interface SavedObjectsDeleteOptions {
  /** Force deletion of an object that exists in multiple namespaces */
  force?: boolean;
}

/**
 * Return type of the Saved Objects `find()` method.
 *
 * *Note*: this type is different between the Public and Server Saved Objects
 * clients.
 *
 * @public
 */
export interface SavedObjectsFindResponsePublic<T = unknown> extends SavedObjectsBatchResponse<T> {
  total: number;
  perPage: number;
  page: number;
}

interface BatchQueueEntry {
  type: string;
  id: string;
  resolve: <T = unknown>(value: SimpleSavedObject<T> | SavedObject<T>) => void;
  reject: (reason?: any) => void;
}

const join = (...uriComponents: Array<string | undefined>) =>
  uriComponents
    .filter((comp): comp is string => Boolean(comp))
    .map(encodeURIComponent)
    .join('/');

/**
 * Interval that requests are batched for
 * @type {integer}
 */
const BATCH_INTERVAL = 100;

const API_BASE_URL = '/api/saved_objects/';

/**
 * SavedObjectsClientContract as implemented by the {@link SavedObjectsClient}
 *
 * @public
 */
export type SavedObjectsClientContract = PublicMethodsOf<SavedObjectsClient>;

interface ObjectTypeAndId {
  id: string;
  type: string;
}

const getObjectsToFetch = (queue: BatchQueueEntry[]): ObjectTypeAndId[] => {
  const objects: ObjectTypeAndId[] = [];
  const inserted = new Set<string>();
  queue.forEach(({ id, type }) => {
    if (!inserted.has(`${type}|${id}`)) {
      objects.push({ id, type });
      inserted.add(`${type}|${id}`);
    }
  });
  return objects;
};

/**
 * Saved Objects is OpenSearchDashboards's data persisentence mechanism allowing plugins to
 * use OpenSearchsearch for storing plugin state. The client-side
 * SavedObjectsClient is a thin convenience library around the SavedObjects
 * HTTP API for interacting with Saved Objects.
 *
 * @public
 */
export class SavedObjectsClient {
  private http: HttpSetup;
  private batchQueue: BatchQueueEntry[];
  /**
   * The currentWorkspaceId may be undefined when workspace plugin is not enabled.
   */
  private currentWorkspaceId: string | undefined;

  /**
   * Check if workspaces field present in given options, if so, overwrite the current workspace id.
   * @param options
   * @returns
   */
  private formatWorkspacesParams(options: {
    workspaces?: SavedObjectsCreateOptions['workspaces'];
  }): { workspaces: string[] } | {} {
    const currentWorkspaceId = this.currentWorkspaceId;
    let finalWorkspaces;
    if (options.hasOwnProperty('workspaces')) {
      finalWorkspaces = options.workspaces;
    } else if (typeof currentWorkspaceId === 'string') {
      finalWorkspaces = [currentWorkspaceId];
    }

    if (finalWorkspaces) {
      return {
        workspaces: finalWorkspaces,
      };
    }

    return {};
  }

  /**
   * Throttled processing of get requests into bulk requests at 100ms interval
   */
  private processBatchQueue = throttle(
    async () => {
      const queue = [...this.batchQueue];
      this.batchQueue = [];

      try {
        const objectsToFetch = getObjectsToFetch(queue);
        const { saved_objects: savedObjects } = await this.performBulkGet(objectsToFetch);

        queue.forEach((queueItem) => {
          const foundObject = savedObjects.find((savedObject) => {
            return savedObject.id === queueItem.id && savedObject.type === queueItem.type;
          });

          if (foundObject) {
            // multiple calls may have been requested the same object.
            // we need to clone to avoid sharing references between the instances
            queueItem.resolve(this.createSavedObject(cloneDeep(foundObject)));
          } else {
            queueItem.resolve(
              this.createSavedObject(pick(queueItem, ['id', 'type']) as SavedObject)
            );
          }
        });
      } catch (err) {
        queue.forEach((queueItem) => {
          queueItem.reject(err);
        });
      }
    },
    BATCH_INTERVAL,
    { leading: false }
  );

  /** @internal */
  constructor(http: HttpSetup) {
    this.http = http;
    this.batchQueue = [];
  }

  public setCurrentWorkspace(workspaceId: string) {
    this.currentWorkspaceId = workspaceId;
  }

  /**
   * Persists an object
   *
   * @param type
   * @param attributes
   * @param options
   * @returns
   */
  public create = <T = unknown>(
    type: string,
    attributes: T,
    options: SavedObjectsCreateOptions = {}
  ): Promise<SimpleSavedObject<T>> => {
    if (!type || !attributes) {
      return Promise.reject(new Error('requires type and attributes'));
    }

    const path = this.getPath([type, options.id]);
    const query = {
      overwrite: options.overwrite,
    };

    const createRequest: Promise<SavedObject<T>> = this.savedObjectsFetch(path, {
      method: 'POST',
      query,
      body: JSON.stringify({
        attributes,
        migrationVersion: options.migrationVersion,
        references: options.references,
        ...this.formatWorkspacesParams(options),
      }),
    });

    return createRequest.then((resp) => this.createSavedObject(resp));
  };

  /**
   * Creates multiple documents at once
   *
   * @param {array} objects - [{ type, id, attributes, references, migrationVersion }]
   * @param {object} [options={}]
   * @property {boolean} [options.overwrite=false]
   * @returns The result of the create operation containing created saved objects.
   */
  public bulkCreate = (
    objects: SavedObjectsBulkCreateObject[] = [],
    options: SavedObjectsBulkCreateOptions = { overwrite: false }
  ) => {
    const path = this.getPath(['_bulk_create']);
    const query: HttpFetchOptions['query'] = { overwrite: options.overwrite };

    const request: ReturnType<SavedObjectsApi['bulkCreate']> = this.savedObjectsFetch(path, {
      method: 'POST',
      query: {
        ...query,
        ...this.formatWorkspacesParams(options),
      },
      body: JSON.stringify(objects),
    });
    return request.then((resp) => {
      resp.saved_objects = resp.saved_objects.map((d) => this.createSavedObject(d));
      return renameKeys<
        PromiseType<ReturnType<SavedObjectsApi['bulkCreate']>>,
        SavedObjectsBatchResponse
      >({ saved_objects: 'savedObjects' }, resp) as SavedObjectsBatchResponse;
    });
  };

  /**
   * Deletes an object
   *
   * @param type
   * @param id
   * @returns
   */
  public delete = (
    type: string,
    id: string,
    options?: SavedObjectsDeleteOptions
  ): ReturnType<SavedObjectsApi['delete']> => {
    if (!type || !id) {
      return Promise.reject(new Error('requires type and id'));
    }

    const query = {
      force: !!options?.force,
    };

    return this.savedObjectsFetch(this.getPath([type, id]), { method: 'DELETE', query });
  };

  /**
   * Search for objects
   *
   * @param {object} [options={}]
   * @property {string} options.type
   * @property {string} options.search
   * @property {string} options.searchFields - see OpenSearch Simple Query String
   *                                        Query field argument for more information
   * @property {integer} [options.page=1]
   * @property {integer} [options.perPage=20]
   * @property {array} options.fields
   * @property {object} [options.hasReference] - { type, id }
   * @returns A find result with objects matching the specified search.
   */
  public find = <T = unknown>(
    options: SavedObjectsFindOptions,
    prependOptions?: PrependOptions
  ): Promise<SavedObjectsFindResponsePublic<T>> => {
    const path = this.getPath(['_find']);
    const renameMap = {
      defaultSearchOperator: 'default_search_operator',
      fields: 'fields',
      hasReference: 'has_reference',
      page: 'page',
      perPage: 'per_page',
      search: 'search',
      searchFields: 'search_fields',
      sortField: 'sort_field',
      type: 'type',
      filter: 'filter',
      namespaces: 'namespaces',
      preference: 'preference',
      workspaces: 'workspaces',
    };

    const renamedQuery = renameKeys<SavedObjectsFindOptions, any>(renameMap, {
      ...options,
      ...this.formatWorkspacesParams(options),
    });
    const query = pick.apply(null, [renamedQuery, ...Object.values<string>(renameMap)]) as Partial<
      Record<string, any>
    >;

    // has_reference needs post-processing since it is an object that needs to be read as
    // a query param
    if (query.has_reference) query.has_reference = JSON.stringify(query.has_reference);

    const request: ReturnType<SavedObjectsApi['find']> = this.savedObjectsFetch(path, {
      method: 'GET',
      query,
      prependOptions,
    });
    return request.then((resp) => {
      return renameKeys<
        PromiseType<ReturnType<SavedObjectsApi['find']>>,
        SavedObjectsFindResponsePublic
      >(
        {
          saved_objects: 'savedObjects',
          total: 'total',
          per_page: 'perPage',
          page: 'page',
        },
        {
          ...resp,
          saved_objects: resp.saved_objects.map((d) => this.createSavedObject(d)),
        }
      ) as SavedObjectsFindResponsePublic<T>;
    });
  };

  /**
   * Fetches a single object
   *
   * @param {string} type
   * @param {string} id
   * @returns The saved object for the given type and id.
   */
  public get = <T = unknown>(type: string, id: string): Promise<SimpleSavedObject<T>> => {
    if (!type || !id) {
      return Promise.reject(new Error('requires type and id'));
    }

    return new Promise((resolve, reject) => {
      this.batchQueue.push({ type, id, resolve, reject } as BatchQueueEntry);
      this.processBatchQueue();
    });
  };

  /**
   * Returns an array of objects by id
   *
   * @param {array} objects - an array ids, or an array of objects containing id and optionally type
   * @returns The saved objects with the given type and ids requested
   * @example
   *
   * bulkGet([
   *   { id: 'one', type: 'config' },
   *   { id: 'foo', type: 'index-pattern' }
   * ])
   */
  public bulkGet = <T = unknown>(objects: Array<{ id: string; type: string }> = []) => {
    const filteredObjects = objects.map((obj) => pick(obj, ['id', 'type']));
    return this.performBulkGet(filteredObjects).then((resp) => {
      resp.saved_objects = resp.saved_objects.map((d) => this.createSavedObject(d));
      return renameKeys<
        PromiseType<ReturnType<SavedObjectsApi['bulkGet']>>,
        SavedObjectsBatchResponse<T>
      >({ saved_objects: 'savedObjects' }, resp) as SavedObjectsBatchResponse<T>;
    });
  };

  private async performBulkGet(objects: ObjectTypeAndId[]) {
    const path = this.getPath(['_bulk_get']);
    const request: ReturnType<SavedObjectsApi['bulkGet']> = this.savedObjectsFetch(path, {
      method: 'POST',
      body: JSON.stringify(objects),
    });
    return request;
  }

  /**
   * Updates an object
   *
   * @param {string} type
   * @param {string} id
   * @param {object} attributes
   * @param {object} options
   * @prop {integer} options.version - ensures version matches that of persisted object
   * @prop {object} options.migrationVersion - The optional migrationVersion of this document
   * @returns
   */
  public update<T = unknown>(
    type: string,
    id: string,
    attributes: T,
    { version, migrationVersion, references }: SavedObjectsUpdateOptions = {}
  ): Promise<SimpleSavedObject<T>> {
    if (!type || !id || !attributes) {
      return Promise.reject(new Error('requires type, id and attributes'));
    }

    const path = this.getPath([type, id]);
    const body = {
      attributes,
      migrationVersion,
      references,
      version,
    };

    return this.savedObjectsFetch(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    }).then((resp: SavedObject<T>) => {
      return this.createSavedObject(resp);
    });
  }

  /**
   * Update multiple documents at once
   *
   * @param {array} objects - [{ type, id, attributes, options: { version, references } }]
   * @returns The result of the update operation containing both failed and updated saved objects.
   */
  public bulkUpdate<T = unknown>(objects: SavedObjectsBulkUpdateObject[] = []) {
    const path = this.getPath(['_bulk_update']);

    return this.savedObjectsFetch(path, {
      method: 'PUT',
      body: JSON.stringify(objects),
    }).then((resp) => {
      resp.saved_objects = resp.saved_objects.map((d: SavedObject<T>) => this.createSavedObject(d));
      return renameKeys<
        PromiseType<ReturnType<SavedObjectsApi['bulkUpdate']>>,
        SavedObjectsBatchResponse
      >({ saved_objects: 'savedObjects' }, resp) as SavedObjectsBatchResponse;
    });
  }

  private createSavedObject<T = unknown>(options: SavedObject<T>): SimpleSavedObject<T> {
    return new SimpleSavedObject(this, options);
  }

  private getPath(path: Array<string | undefined>): string {
    return resolveUrl(API_BASE_URL, join(...path));
  }

  /**
   * To ensure we don't break backwards compatibility, savedObjectsFetch keeps
   * the old kfetch error format of `{res: {status: number}}` whereas `http.fetch`
   * uses `{response: {status: number}}`.
   */
  private savedObjectsFetch(
    path: string,
    { method, query, body, prependOptions }: HttpFetchOptions
  ) {
    return this.http.fetch(path, {
      method,
      query,
      body,
      ...(prependOptions && { prependOptions }),
    });
  }
}

/**
 * Returns a new object with the own properties of `obj`, but the
 * keys renamed according to the `keysMap`.
 *
 * @param keysMap - a map of the form `{oldKey: newKey}`
 * @param obj - the object whose own properties will be renamed
 */
const renameKeys = <T extends Record<string, any>, U extends Record<string, any>>(
  keysMap: Record<keyof T, keyof U>,
  obj: Record<string, any>
) =>
  Object.keys(obj).reduce((acc, key) => {
    return {
      ...acc,
      ...{ [keysMap[key] || key]: obj[key] },
    };
  }, {});
