/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { NavigationPublicPluginStart } from '../../navigation/public';

export interface DiyaSetupDeps {}

export interface DiyaStartDeps {
  navigation: NavigationPublicPluginStart;
}

export enum Roles {
  HUMAN = 'Human',
  ASSISTANT = 'Assistant',
}

export interface Attachment {
  name: string;
  content: string;
}

export interface Message {
  text: string;
  sender: Roles;
  attachments?: Attachment[];
}

export interface Branch {
  id: number;
  name: string;
  messages: Message[];
  attachments: File[];
  createdAt: Date;
  description?: string;
}

export interface ChatThread {
  id: string;
  name: string;
  branches: Branch[];
  currentBranchId: number;
}

export interface ChatApiInterface {
  sendMessage: (prompt: string, chatHistory: Array<Message>) => Promise<any>;
  getLatestResponse: (
    conversationId: string,
    timestamp: number
  ) => Promise<{
    status: string;
    latestResponse: string;
  }>;
  abortConversation: (conversationId: string) => Promise<void>;
}
