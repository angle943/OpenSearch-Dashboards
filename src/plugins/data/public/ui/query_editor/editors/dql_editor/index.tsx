/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createEditor, SingleLineInput } from '../shared';

interface DQLBodyProps extends React.JSX.IntrinsicAttributes {
  filterBar?: any;
}

export const DQLBody: React.FC<DQLBodyProps> = ({ filterBar }) => <div>{filterBar}</div>;

// @ts-expect-error TS2554 TODO(ts-error): fixme
export const createDQLEditor = createEditor(SingleLineInput, SingleLineInput, DQLBody);
