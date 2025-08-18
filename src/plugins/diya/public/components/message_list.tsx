/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { Message, Roles } from '../types';
import { MessageComponent } from './message';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="diya-messages">
      {messages.map((message, index) => (
        <MessageComponent key={index} message={message} />
      ))}

      {isLoading && (
        <div className="diya-message diya-message-assistant">
          <div className="diya-loading">
            <span>Thinking</span>
            <span className="diya-loading-dots"></span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};
