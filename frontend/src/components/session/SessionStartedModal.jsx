// src/components/session/SessionStartedModal.jsx
import { useState } from 'react';
import { Modal, Typography, Input, Button, Space, Divider, message, Tooltip } from 'antd';
import { CopyOutlined, CheckOutlined, LinkOutlined, PlayCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

function SessionStartedModal({ sessionId, gameId, onClose, onViewSession }) {
  console.log("🚀 ~ SessionStartedModal ~ gameId:", gameId);
  const [copied, setCopied] = useState(false);
  const playLink = `${window.location.origin}/play/${sessionId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(playLink);
    setCopied(true);
    message.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      title={<Title level={3}>Game Session Started</Title>}
      open={true}
      onCancel={onClose}
      width={500}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button 
          key="view" 
          type="primary" 
          icon={<PlayCircleOutlined />} 
          onClick={onViewSession}
        >
          View Session
        </Button>
      ]}
      centered
    >
      <Divider />

      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Paragraph>
          <Text strong>Session ID:</Text> <Text copyable>{sessionId}</Text>
        </Paragraph>

        <div>
          <Paragraph strong>
            <LinkOutlined /> Share this link with players:
          </Paragraph>

          <Input 
            value={playLink} 
            readOnly 
            size="large"
            addonAfter={
              <Tooltip title={copied ? "Copied!" : "Copy link"}>
                <Button 
                  type="link" 
                  icon={copied ? <CheckOutlined /> : <CopyOutlined />} 
                  onClick={handleCopyLink}
                  style={{ border: 'none', padding: '0 8px' }}
                />
              </Tooltip>
            }
          />
        </div>

        <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
          <Text type="secondary">
            Players can join the game using the link above. The host can manage the session using the &quot;View Session&quot; button.
          </Text>
        </div>
      </Space>
    </Modal>
  );
}

export default SessionStartedModal;
