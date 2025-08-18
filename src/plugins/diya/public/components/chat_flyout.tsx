/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  EuiFlyout, 
  EuiFlyoutHeader, 
  EuiFlyoutBody, 
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem
} from '@elastic/eui';
import { v4 as uuidv4 } from 'uuid';
import { Message, Roles, ChatThread } from '../types';
import { ChatInput } from './chat_input';
import { MessageList } from './message_list';

interface ChatFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatFlyout: React.FC<ChatFlyoutProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentThread] = useState<ChatThread>({
    id: uuidv4(),
    name: 'Diya Chat',
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
        text: `I received your message: "${userMessage.text}". This is a placeholder response from the Diya chat flyout.`,
        sender: Roles.ASSISTANT,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <EuiFlyout 
      onClose={onClose} 
      size="m" 
      paddingSize="none"
      aria-labelledby="diya-chat-flyout-title"
    >
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="m">
          <h2 id="diya-chat-flyout-title">Diya Chat</h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      
      <EuiFlyoutBody className="diya-flyout-body">
        <EuiFlexGroup direction="column" style={{ height: '100%' }}>
          <EuiFlexItem grow={true} style={{ overflow: 'hidden' }}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <MessageList messages={messages} isLoading={isLoading} />
            </div>
          </EuiFlexItem>
          
          <EuiFlexItem grow={false}>
            <ChatInput
              input={input}
              setInput={setInput}
              onSend={handleSend}
              isLoading={isLoading}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutBody>
    </EuiFlyout>
  );
};