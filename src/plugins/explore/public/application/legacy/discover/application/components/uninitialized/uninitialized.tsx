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

import React from 'react';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';

import { EuiSmallButton, EuiEmptyPrompt, EuiPage, EuiPageBody, EuiPageContent } from '@elastic/eui';

interface Props {
  onRefresh: () => void;
}

export const DiscoverUninitialized = ({ onRefresh }: Props) => {
  return (
    <I18nProvider>
      <EuiPage>
        <EuiPageBody component="main">
          <EuiPageContent horizontalPosition="center">
            <EuiEmptyPrompt
              iconType="discoverApp"
              title={
                <h2>
                  <FormattedMessage
                    id="explore.discover.uninitializedTitle"
                    defaultMessage="Start searching"
                  />
                </h2>
              }
              body={
                <p>
                  <FormattedMessage
                    id="explore.discover.uninitializedText"
                    defaultMessage="Write a query, add some filters, or simply hit Refresh to retrieve results for the current query."
                  />
                </p>
              }
              actions={
                <EuiSmallButton
                  color="primary"
                  fill
                  onClick={onRefresh}
                  data-test-subj="discover-refreshDataButton"
                >
                  <FormattedMessage
                    id="explore.discover.uninitializedRefreshButtonText"
                    defaultMessage="Refresh data"
                  />
                </EuiSmallButton>
              }
            />
          </EuiPageContent>
        </EuiPageBody>
      </EuiPage>
    </I18nProvider>
  );
};
