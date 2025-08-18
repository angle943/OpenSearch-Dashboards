/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Message, Roles } from '../types';

interface MessageProps {
  message: Message;
}

export const MessageComponent: React.FC<MessageProps> = ({ message }) => {
  const isHuman = message.sender === Roles.HUMAN;
  const className = `diya-message ${isHuman ? 'diya-message-human' : 'diya-message-assistant'}`;

  return (
    <div className={className}>
      <div className="diya-message-content">
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            fontFamily: 'inherit',
            margin: 0,
          }}
        >
          {message.text}
        </pre>
      </div>

      {message.attachments && message.attachments.length > 0 && (
        <div className="diya-message-attachments">
          {message.attachments.map((attachment, index) => (
            <div key={index} className="diya-attachment">
              📎 {attachment.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
