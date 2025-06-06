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

import { EuiIcon } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React from 'react';
import { ChromeNavLink, ChromeRecentlyAccessedHistoryItem, CoreStart } from '../../..';
import { HttpStart } from '../../../http';
import { InternalApplicationStart } from '../../../application/types';
import { relativeToAbsolute } from '../../nav_links/to_nav_link';
import { formatUrlWithWorkspaceId } from '../../../utils';

export const isModifiedOrPrevented = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) =>
  event.metaKey || event.altKey || event.ctrlKey || event.shiftKey || event.defaultPrevented;

// TODO: replace hard-coded values with a registration function, so that apps can control active nav links similar to breadcrumbs
const aliasedApps: { [key: string]: string[] } = {
  discover: ['data-explorer'],
  explore: ['data-explorer'],
};

export const isActiveNavLink = (appId: string | undefined, linkId: string): boolean =>
  !!(appId === linkId || aliasedApps[linkId]?.includes(appId || ''));

interface Props {
  link: ChromeNavLink;
  appId?: string;
  basePath?: HttpStart['basePath'];
  dataTestSubj: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  navigateToApp: CoreStart['application']['navigateToApp'];
  externalLink?: boolean;
}

// TODO #64541
// Set return type to EuiListGroupItemProps
// Currently it's a subset of EuiListGroupItemProps+FlyoutMenuItem for CollapsibleNav and NavDrawer
// But FlyoutMenuItem isn't exported from EUI
export function createEuiListItem({
  link,
  appId,
  basePath,
  onClick = () => {},
  navigateToApp,
  dataTestSubj,
  externalLink = false,
}: Props) {
  const { href, id, title, disabled, euiIconType, icon, tooltip } = link;

  return {
    label: tooltip ?? title,
    href,
    /* Use href and onClick to support "open in new tab" and SPA navigation in the same link */
    onClick(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
      if (!isModifiedOrPrevented(event)) {
        onClick(event);
      }

      if (
        !externalLink && // ignore external links
        event.button === 0 && // ignore everything but left clicks
        !isModifiedOrPrevented(event)
      ) {
        event.preventDefault();
        navigateToApp(id);
      }
    },
    isActive: isActiveNavLink(appId, id),
    isDisabled: disabled,
    'data-test-subj': dataTestSubj,
    ...(basePath && {
      iconType: euiIconType,
      icon:
        !euiIconType && icon ? <EuiIcon type={basePath.prepend(`/${icon}`)} size="m" /> : undefined,
    }),
  };
}

export interface RecentNavLink {
  href: string;
  label: string;
  title: string;
  'aria-label': string;
  iconType?: string;
  onClick: React.MouseEventHandler;
}

/**
 * Add saved object type info to recently links
 * TODO #64541 - set return type to EuiListGroupItemProps
 *
 * Recent nav links are similar to normal nav links but are missing some OpenSearch Dashboards Platform magic and
 * because of legacy reasons have slightly different properties.
 * @param recentLink
 * @param navLinks
 * @param basePath
 */
export function createRecentNavLink(
  recentLink: ChromeRecentlyAccessedHistoryItem,
  navLinks: ChromeNavLink[],
  basePath: HttpStart['basePath'],
  navigateToUrl: InternalApplicationStart['navigateToUrl'],
  workspaceEnabled: boolean = false
): RecentNavLink {
  const { link, label, workspaceId } = recentLink;
  const href = relativeToAbsolute(
    basePath.prepend(
      workspaceEnabled ? formatUrlWithWorkspaceId(link, workspaceId || '', basePath) : link,
      {
        withoutClientBasePath: true,
      }
    )
  );
  const navLink = navLinks.find((nl) => href.startsWith(nl.baseUrl));
  let titleAndAriaLabel = label;

  if (navLink) {
    titleAndAriaLabel = i18n.translate('core.ui.recentLinks.linkItem.screenReaderLabel', {
      defaultMessage: '{recentlyAccessedItemLinklabel}, type: {pageType}',
      values: {
        recentlyAccessedItemLinklabel: label,
        pageType: navLink.title,
      },
    });
  }

  return {
    href,
    label,
    title: titleAndAriaLabel,
    'aria-label': titleAndAriaLabel,
    iconType: navLink?.euiIconType,
    /* Use href and onClick to support "open in new tab" and SPA navigation in the same link */
    onClick(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
      if (event.button === 0 && !isModifiedOrPrevented(event)) {
        event.preventDefault();
        navigateToUrl(href);
      }
    },
  };
}
