/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CoreStart } from '../../../../core/public';
import { DiyaStartDeps, Message, Roles, ChatThread, Branch } from '../types';
import { ChatInput } from './chat_input';
import { MessageList } from './message_list';

interface DiyaAppProps {
  getStartServices: () => Promise<[CoreStart, DiyaStartDeps, unknown]>;
}

export const DiyaApp: React.FC<DiyaAppProps> = ({ getStartServices }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentThread] = useState<ChatThread>({
    id: uuidv4(),
    name: 'New Chat',
    branches: [
      {
        id: 0,
        name: 'Main',
        messages: [],
        attachments: [],
        createdAt: new Date(),
      },
    ],
    currentBranchId: 0,
  });

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      text: input,
      sender: Roles.HUMAN,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate API response (replace with actual API call)
    setTimeout(() => {
      const assistantMessage: Message = {
        text: `I received your message: "${userMessage.text}". This is a placeholder response from the Diya chat plugin running inside OpenSearch Dashboards.`,
        sender: Roles.ASSISTANT,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="diya-app">
      <div className="diya-header">
        <h1>Diya Chat</h1>
        <span>Thread: {currentThread.name}</span>
      </div>

      <div className="diya-chat-container">
        <MessageList messages={messages} isLoading={isLoading} />

        <ChatInput input={input} setInput={setInput} onSend={handleSend} isLoading={isLoading} />
      </div>
    </div>
  );
};
