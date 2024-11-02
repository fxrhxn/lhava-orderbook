import React, { useEffect, useState, useRef } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import Draggable from 'react-draggable';
import logo from './logo.png'; // Ensure to import your logo image

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    background-color: #141822;
    font-family: Arial, sans-serif;
  }
`;

const DraggableContainer = styled(Draggable)`
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  cursor: move;
  z-index: 1000;
`;

const Container = styled.div`
  background-color: #f5f5f5;
  width: 100%;
  max-width: 600px;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #0A0F19;
  color: #fff;
  padding: 10px;
  border-radius: 8px 8px 0 0;
`;

const Logo = styled.img`
  height: 39px;
  margin-bottom: -7px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 13px;
`;

const StatusBar = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background-color: #eee;
  font-size: 14px;
  color: #333;
`;

const StatusText = styled.span`
  color: ${({ isConnected }) => (isConnected ? '#2ECC40' : '#FF4136')};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: center;
`;

const TableContainer = styled.div`
  max-height: 200px; /* Limit table height */
  overflow-y: auto; /* Scrollable table */
`;

const TableHeader = styled.th`
  padding: 8px;
  background-color: #2DE6C7;
  font-size: 12px;
  color: #333;
`;

const Row = styled.tr`
  color: ${({ isIncrease }) => (isIncrease ? '#2ECC40' : '#FF4136')};
  background-color: #fff;
  &:nth-child(even) {
    background-color: #f9f9f9;
  }
`;

const DividerColumn = styled.td`
  width: 2px;
  background-color: #ddd;
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-around;
  padding: 10px;
  background-color: #ddd;
  border-radius: 0 0 8px 8px;
`;

const Button = styled.button`
  padding: 5px 10px;
  font-size: 14px;
  background-color: #A63EE8;
  color: white;
  margin-right: -20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
  &:hover {
    background-color: #2DE6C7;
  }
  &:focus {
    outline: 2px solid #2DE6C7;
  }
`;

const Orderbook = () => {
  const [bids, setBids] = useState([]);
  const [asks, setAsks] = useState([]);
  const [status, setStatus] = useState('Disconnected');
  const [latency, setLatency] = useState(0);
  const isConnected = status === 'Connected';
  const ws = useRef(null);
  const ROW_LIMIT = 10; // Row limit for display

  const connectWebSocket = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.close();
    }

    ws.current = new WebSocket('ws://localhost:5000');

    ws.current.onopen = () => {
      setStatus('Connected');
    };

    ws.current.onclose = () => {
      setStatus('Disconnected');
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
      setStatus('Error');
    };

    ws.current.onmessage = (event) => {
      const start = Date.now();
      const data = JSON.parse(event.data);

      setBids((prevBids) => {
        return data.bids.slice(0, ROW_LIMIT).map((bid, index) => ({
          ...bid,
          isIncrease: prevBids[index] ? bid.price > prevBids[index].price : false,
        }));
      });

      setAsks((prevAsks) => {
        return data.asks.slice(0, ROW_LIMIT).map((ask, index) => ({
          ...ask,
          isIncrease: prevAsks[index] ? ask.price > prevAsks[index].price : false,
        }));
      });

      const end = Date.now();
      setLatency(end - start);
    };
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return (
    <>
      <GlobalStyle />
      <DraggableContainer>
        <Container>
          <Header>
            <Logo src={logo} alt="Logo" />
            <Title>BTC Orderbook - Vertex Exchange</Title>
          </Header>
          <StatusBar>
            <div>Status: <StatusText isConnected={isConnected}>{status}</StatusText></div>
            <div>Latency: {latency}ms</div>
          </StatusBar>
          <TableContainer>
            <Table>
              <thead>
                <tr>
                  <TableHeader colSpan="3">BIDS</TableHeader>
                  <DividerColumn />
                  <TableHeader colSpan="3">ASKS</TableHeader>
                </tr>
                <tr>
                  <TableHeader>Price</TableHeader>
                  <TableHeader>Qty</TableHeader>
                  <TableHeader>Total</TableHeader>
                  <DividerColumn />
                  <TableHeader>Price</TableHeader>
                  <TableHeader>Qty</TableHeader>
                  <TableHeader>Total</TableHeader>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: ROW_LIMIT }, (_, i) => (
                  <Row key={i} isIncrease={bids[i]?.isIncrease}>
                    <td>{bids[i]?.price || '-'}</td>
                    <td>{bids[i]?.quantity || '-'}</td>
                    <td>
                      {bids[i]
                        ? bids.slice(0, i + 1).reduce((sum, b) => sum + parseFloat(b.quantity), 0).toFixed(2)
                        : '-'}
                    </td>
                    <DividerColumn />
                    <td>{asks[i]?.price || '-'}</td>
                    <td>{asks[i]?.quantity || '-'}</td>
                    <td>
                      {asks[i]
                        ? asks.slice(0, i + 1).reduce((sum, a) => sum + parseFloat(a.quantity), 0).toFixed(2)
                        : '-'}
                    </td>
                  </Row>
                ))}
              </tbody>
            </Table>
          </TableContainer>
          <Footer>
            <Button onClick={connectWebSocket}>Refresh</Button>
          </Footer>
        </Container>
      </DraggableContainer>
    </>
  );
};

export default Orderbook;
