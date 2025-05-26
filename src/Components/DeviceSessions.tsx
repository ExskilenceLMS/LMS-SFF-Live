import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Spinner, Badge, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format, formatDistance } from 'date-fns';

interface DeviceSession {
  id: string;
  device_name: string;
  device_type: string;
  ip_address: string;
  last_active: string;
  created_at: string;
}

const DeviceSessions: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [sessionToRevoke, setSessionToRevoke] = useState<string | null>(null);
  const [revokeAll, setRevokeAll] = useState<boolean>(false);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get<{ sessions: DeviceSession[] }>(
        'https://live-exskilence-be.azurewebsites.net/api/sessions/',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwt_token')}`
          }
        }
      );
      
      setSessions(response.data.sessions);
      
      const currentDevice = localStorage.getItem('current_device');
      const currentSession = response.data.sessions.find(
        session => session.device_name === currentDevice
      );
      
      if (currentSession) {
        setCurrentDeviceId(currentSession.id);
      }
      
      setError(null);
    } catch (err: any) {
      setError('Failed to load your active sessions');
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = (sessionId: string) => {
    setSessionToRevoke(sessionId);
    setRevokeAll(false);
    setShowConfirmModal(true);
  };

  const handleRevokeAll = () => {
    setRevokeAll(true);
    setSessionToRevoke(null);
    setShowConfirmModal(true);
  };

  const confirmRevoke = async () => {
    try {
      setLoading(true);
      
      if (revokeAll) {
        await axios.post(
          'https://live-exskilence-be.azurewebsites.net/api/revoke-all/',
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('jwt_token')}`
            }
          }
        );
        
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('current_device');
        navigate('/');
      } else if (sessionToRevoke) {
        await axios.post(
          'https://live-exskilence-be.azurewebsites.net/api/revoke/',
          { session_id: sessionToRevoke },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('jwt_token')}`
            }
          }
        );
        
        if (sessionToRevoke === currentDeviceId) {
          localStorage.removeItem('jwt_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('current_device');
          navigate('/');
        } else {
          fetchSessions();
        }
      }
    } catch (err) {
      setError('Failed to revoke session');
      console.error('Error revoking session:', err);
    } finally {
      setShowConfirmModal(false);
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center" style={{ backgroundColor: '#6f42c1', color: 'white' }}>
          <h4 className="mb-0">Your Active Sessions</h4>
          <div>
            <Button 
              variant="outline-light" 
              size="sm" 
              onClick={fetchSessions} 
              disabled={refreshing}
              className="me-2"
            >
              {refreshing ? <Spinner animation="border" size="sm" /> : 'Refresh'}
            </Button>
            <Button 
              variant="light" 
              size="sm" 
              onClick={handleRevokeAll}
              disabled={loading || sessions.length <= 1}
            >
              Sign Out All Devices
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          
          {loading && !refreshing ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading your sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">No active sessions found.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Device</th>
                    <th>IP Address</th>
                    <th>First Login</th>
                    <th>Last Active</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id} className={session.id === currentDeviceId ? 'table-primary' : ''}>
                      <td>
                        <div className="d-flex flex-column">
                          <span className="fw-bold">{session.device_name}</span>
                          <span className="text-muted">{session.device_type}</span>
                          {session.id === currentDeviceId && (
                            <Badge bg="info" className="mt-1 w-auto">Current Device</Badge>
                          )}
                        </div>
                      </td>
                      <td>{session.ip_address}</td>
                      <td>
                        {format(new Date(session.created_at), 'MMM d, yyyy')}
                        <br />
                        <small className="text-muted">
                          {format(new Date(session.created_at), 'h:mm a')}
                        </small>
                      </td>
                      <td>
                        {formatDistance(new Date(session.last_active), new Date(), { addSuffix: true })}
                      </td>
                      <td className="text-center">
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRevoke(session.id)}
                        >
                          {session.id === currentDeviceId ? 'Sign Out' : 'Revoke'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm {revokeAll ? 'Sign Out' : 'Revocation'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {revokeAll ? (
            <p>Are you sure you want to sign out from all devices? This will end all your active sessions.</p>
          ) : (
            <>
              <p>Are you sure you want to revoke this device session?</p>
              {sessionToRevoke === currentDeviceId && (
                <div className="alert alert-warning">
                  <strong>Note:</strong> This is your current device. You will be signed out.
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmRevoke}>
            {revokeAll ? 'Sign Out All Devices' : sessionToRevoke === currentDeviceId ? 'Sign Out' : 'Revoke Session'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default DeviceSessions;