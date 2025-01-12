import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper,
  CircularProgress,
  Grid,
  Chip,
  Container,
  Divider
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Helpline from '../components/Helpline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function ChatBot() {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: 'Hello! I can help you with earthquake-related questions and safety information. What would you like to know?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      console.log('Sending message to backend:', input);  // Debug log
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      console.log('Received response:', data);  // Debug log

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response from server');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response 
      }]);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${error.message}. Please try again.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    "How to create an earthquake emergency plan?",
    "Tips for earthquake-proofing your home?",
    "What to do during an earthquake?",
    "How to prepare a disaster supply kit?"
  ];

  const handleQuickQuestion = async (question) => {
    // Add user message immediately
    const userMessage = { role: 'user', content: question };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: question }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response from server');
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response 
      }]);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${error.message}. Please try again.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessage = (content) => {
    // Split message by newlines and filter out empty lines
    const lines = content.split('\n').filter(line => line.trim());
    
    return lines.map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < lines.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <Container maxWidth="xl" sx={{ height: 'calc(100vh - 64px)' }}>
      <Box sx={{ 
        height: '100%', 
        py: 3,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Grid container spacing={3} sx={{ height: '100%' }}>
          {/* Chat Section */}
          <Grid item xs={12} md={8} sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Typography variant="h4" gutterBottom>
              Earthquake Safety Assistant
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
              Get expert advice on earthquake safety and preparedness
            </Typography>

            {/* Quick Questions */}
            <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>
                Common Questions:
              </Typography>
              <Grid container spacing={1}>
                {quickQuestions.map((question, index) => (
                  <Grid item key={index}>
                    <Chip
                      icon={<HelpOutlineIcon />}
                      label={question}
                      onClick={() => handleQuickQuestion(question)}
                      sx={{ 
                        '&:hover': { 
                          bgcolor: 'primary.main', 
                          color: 'white',
                          '& .MuiSvgIcon-root': {
                            color: 'white'
                          }
                        }
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {error && (
              <Paper 
                elevation={0} 
                sx={{ 
                  bgcolor: '#ffebee', 
                  color: '#c62828', 
                  p: 2, 
                  mb: 2,
                  borderRadius: 1
                }}
              >
                <Typography>{error}</Typography>
              </Paper>
            )}

            {/* Chat Messages */}
            <Paper 
              elevation={0} 
              sx={{ 
                flex: 1,
                mb: 2, 
                p: 2, 
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {messages.map((message, index) => (
                <Box
                  key={index}
                  sx={{
                    alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
                    backgroundColor: message.role === 'user' ? 'primary.main' : 'background.default',
                    color: message.role === 'user' ? 'white' : 'text.primary',
                    borderRadius: 2,
                    p: 2,
                    border: message.role === 'assistant' ? '1px solid' : 'none',
                    borderColor: 'divider',
                    '& .markdown-content': {
                      color: message.role === 'user' ? 'white' : 'inherit',
                    },
                    '& .markdown-content h3': {
                      color: message.role === 'user' ? 'white' : '#1e293b',
                    },
                    '& .markdown-content strong': {
                      color: message.role === 'user' ? 'white' : '#1e293b',
                    }
                  }}
                >
                  <div className="markdown-content">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // This ensures proper styling for different markdown elements
                        h3: ({node, ...props}) => <h3 style={{margin: '1rem 0 0.5rem'}} {...props}/>,
                        p: ({node, ...props}) => <p style={{margin: '0.5rem 0'}} {...props}/>,
                        ul: ({node, ...props}) => <ul style={{margin: '0.5rem 0', paddingLeft: '1.5rem'}} {...props}/>,
                        li: ({node, ...props}) => <li style={{margin: '0.25rem 0'}} {...props}/>
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </Box>
              ))}
              {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress size={24} />
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Paper>

            {/* Input Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
              <TextField
                fullWidth
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about earthquake safety..."
                disabled={isLoading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
              <Button 
                type="submit" 
                variant="contained" 
                disabled={isLoading}
                endIcon={<SendIcon />}
                sx={{ px: 3, borderRadius: 2 }}
              >
                Send
              </Button>
            </form>
          </Grid>

          {/* Helpline Section */}
          <Grid item xs={12} md={4} sx={{ height: '100%', overflow: 'auto' }}>
            <Helpline />
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default ChatBot; 