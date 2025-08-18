/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  EuiButtonIcon, 
  EuiToolTip
} from '@elastic/eui';
import { ChatFlyout } from './chat_flyout';

export const ChatButton: React.FC = () => {
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);

  const toggleFlyout = () => {
    setIsFlyoutOpen(!isFlyoutOpen);
  };

  return (
    <>
      <EuiToolTip content="Open Diya Chat" position="right">
        <EuiButtonIcon
          iconType="discuss"
          color={isFlyoutOpen ? 'primary' : 'text'}
          size="s"
          onClick={toggleFlyout}
          aria-label="Open Diya Chat"
          data-test-subj="diya-chat-button"
          style={{
            backgroundColor: isFlyoutOpen ? 'rgba(0, 119, 204, 0.1)' : 'transparent',
            border: isFlyoutOpen ? '1px solid #0077cc' : 'none',
            borderRadius: '6px',
          }}
        />
      </EuiToolTip>
      
      <ChatFlyout 
        isOpen={isFlyoutOpen} 
        onClose={() => setIsFlyoutOpen(false)} 
      />
    </>
  );
};