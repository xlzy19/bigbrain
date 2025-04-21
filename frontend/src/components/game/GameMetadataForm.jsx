// src/components/game/GameMetadataForm.jsx
import { useState } from 'react';
import { Form, Input, Button, Upload, message, Divider, Typography } from 'antd';
import { UploadOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';

const { Title } = Typography;

function GameMetadataForm({ initialData, onSubmit, onCancel }) {
  const [form] = Form.useForm();
  const [thumbnail, setThumbnail] = useState(initialData.thumbnail || '');

  const handleSubmit = () => {
    form.validateFields().then(values => {
      if (!values.name.trim()) {
        message.error('Game name cannot be empty');
        return;
      }
      
      onSubmit({ 
        name: values.name, 
        thumbnail
      });
    }).catch(err => {
      console.log("🚀 ~ handleSubmit ~ err:", err);
      message.error('Please check if the form is filled out correctly');
    });
  };

  const handleFileChange = (info) => {
    if (info.file.status === 'done') {
      message.success(`${info.file.name} uploaded successfully`);
      
      // Usually the URL is returned from the server, here we simulate it
      // In actual applications, the server response should be used
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnail(reader.result);
      };
      
      if (info.file.originFileObj) {
        reader.readAsDataURL(info.file.originFileObj);
      }
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} upload failed`);
    }
  };

  // Custom upload handler
  const customUpload = ({ file, onSuccess, onError }) => {
    console.log("🚀 ~ customUpload ~ file:", file);
    console.log("🚀 ~ customUpload ~ onError:", onError);
    
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };

  return (
    <div className="game-metadata-form">
      <Title level={4}>Edit Game Info</Title>
      <Divider />
      
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: initialData.name || ''
        }}
      >
        <Form.Item
          name="name"
          label="Game Name"
          rules={[{ required: true, message: 'Please enter the game name' }]}
        >
          <Input 
            placeholder="Enter game name"
            maxLength={50}
            showCount
          />
        </Form.Item>
        
        <Form.Item
          label="Game Thumbnail"
          extra="Supports JPG, PNG format, recommended size: 1280x720"
        >
          <Upload
            name="thumbnail"
            listType="picture-card"
            showUploadList={false}
            customRequest={customUpload}
            onChange={handleFileChange}
          >
            {thumbnail ? (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <img 
                  src={thumbnail} 
                  alt="Thumbnail Preview" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: '100%', 
                    background: 'rgba(0,0,0,0.2)', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    opacity: 0,
                    transition: 'all 0.3s',
                  }}
                  className="thumbnail-hover"
                >
                  <UploadOutlined style={{ color: '#fff', fontSize: '24px' }} />
                </div>
              </div>
            ) : (
              <div>
                <UploadOutlined style={{ fontSize: '32px', color: '#999' }} />
                <div style={{ marginTop: 8 }}>Upload Thumbnail</div>
              </div>
            )}
          </Upload>
        </Form.Item>
        
        <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
          <Button 
            onClick={onCancel} 
            style={{ marginRight: '12px' }}
            icon={<CloseOutlined />}
          >
            Cancel
          </Button>
          <Button 
            type="primary" 
            onClick={handleSubmit}
            icon={<SaveOutlined />}
          >
            Save
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

export default GameMetadataForm;
