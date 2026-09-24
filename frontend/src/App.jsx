import { useState, useEffect } from 'react';
import { 
  Container, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TablePagination, Chip, CssBaseline,
  Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Tabs, Tab, Grid, Divider, List, ListItem, ListItemText
} from '@mui/material';
import api from './api';

function App() {
  const [tickets, setTickets] = useState([]);
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  
  const [tabValue, setTabValue] = useState(0);
  const [ordering, setOrdering] = useState('-created_at');
  
  // REQUIREMENT: Search query state and loading state added
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState({ client: '', concerned_department: '', facility_manager: '' });

  const [openCreate, setOpenCreate] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: '', description: '', officeType: 'single', floors: '', clientMapping: 'single', selectedClient: '' });

  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchTickets = async () => {
    try {
      const tabState = tabValue === 0 ? 'open' : 'closed';
      let url = `/tickets/?page=${page + 1}&tab=${tabState}&ordering=${ordering}`;
      
      // Append filters and search query
      if (searchQuery) url += `&search=${searchQuery}`;
      if (filters.concerned_department) url += `&concerned_department=${filters.concerned_department}`;
      if (filters.client) url += `&client=${filters.client}`;
      if (filters.facility_manager) url += `&facility_manager=${filters.facility_manager}`;
      
      const response = await api.get(url);
      setTickets(response.data.results);
      setCount(response.data.count);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [page, tabValue, ordering, filters, searchQuery]);

  const handleCreate = async () => {
    try {
      const payload = {
        title: newTicket.title,
        description: newTicket.description,
        floors: newTicket.officeType === 'multi' ? newTicket.floors : null,
      };
      await api.post('/tickets/', payload);
    } catch (error) {
      console.error("Error creating ticket:", error);
    } finally {
      setOpenCreate(false);
      setNewTicket({ title: '', description: '', officeType: 'single', floors: '', clientMapping: 'single', selectedClient: '' });
      setPage(0); 
      fetchTickets();
    }
  };

  const handleWorkflow = async (ticketId, actionType) => {
    const noteElement = document.getElementById('action-note');
    const note = noteElement ? noteElement.value : '';
    
    try {
      await api.post(`/tickets/${ticketId}/workflow_action/`, { action_type: actionType, note: note });
      if (noteElement) noteElement.value = '';
      setSelectedTicket(null);
      fetchTickets();
    } catch (error) {
      console.error("Error executing workflow:", error);
    }
  };

  return (
    <>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
          Urban Vault Ticket Dashboard
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, val) => { setTabValue(val); setPage(0); }}>
            <Tab label="Open Tickets" />
            <Tab label="Closed Tickets" />
          </Tabs>
        </Box>

        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* REQUIREMENT: Global Search Bar */}
          <TextField 
            label="Search Tickets..." size="small" sx={{ width: 200 }}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
          />
          <TextField 
            label="Department" size="small" sx={{ width: 150 }}
            value={filters.concerned_department}
            onChange={(e) => { setFilters({ ...filters, concerned_department: e.target.value }); setPage(0); }}
          />
          <TextField 
            label="Client Name" size="small" sx={{ width: 150 }}
            value={filters.client}
            onChange={(e) => { setFilters({ ...filters, client: e.target.value }); setPage(0); }}
          />
          <TextField 
            label="Facility Manager" size="small" sx={{ width: 150 }}
            value={filters.facility_manager}
            onChange={(e) => { setFilters({ ...filters, facility_manager: e.target.value }); setPage(0); }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort By</InputLabel>
            <Select value={ordering} label="Sort By" onChange={(e) => setOrdering(e.target.value)}>
              <MenuItem value="-created_at">Newest First</MenuItem>
              <MenuItem value="created_at">Older First</MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" color="success" onClick={() => setOpenCreate(true)}>
            + New Ticket
          </Button>
        </Box>

        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Issue</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id} hover>
                  <TableCell>#{ticket.id}</TableCell>
                  <TableCell>{ticket.title}</TableCell>
                  <TableCell>{ticket.concerned_department || 'Unassigned'}</TableCell>
                  <TableCell>
                    <Chip label={ticket.status} size="small" color={ticket.status === 'OPEN' ? 'error' : 'default'} />
                  </TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined" onClick={() => setSelectedTicket(ticket)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={count}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={10}
            rowsPerPageOptions={[10]}
          />
        </TableContainer>
      </Container>

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle fontWeight="bold">Create New Ticket</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense" label="Issue*" fullWidth variant="outlined" required
            value={newTicket.title} onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Client Mapping State</InputLabel>
                <Select
                  value={newTicket.clientMapping} label="Client Mapping State"
                  onChange={(e) => setNewTicket({ ...newTicket, clientMapping: e.target.value })}
                >
                  <MenuItem value="single">Single Client Mapped</MenuItem>
                  <MenuItem value="multi">Multiple Clients Mapped</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Office Property Type</InputLabel>
                <Select
                  value={newTicket.officeType} label="Office Property Type"
                  onChange={(e) => setNewTicket({ ...newTicket, officeType: e.target.value })}
                >
                  <MenuItem value="single">Single Floor Office</MenuItem>
                  <MenuItem value="multi">Multiple Floors Office</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {newTicket.clientMapping === 'multi' && (
            <TextField
              margin="dense" label="Client*" fullWidth variant="outlined"
              value={newTicket.selectedClient} onChange={(e) => setNewTicket({ ...newTicket, selectedClient: e.target.value })}
              sx={{ mb: 2 }}
            />
          )}

          {newTicket.officeType === 'multi' && (
            <TextField
              margin="dense" label="Floor(s)*" fullWidth variant="outlined"
              value={newTicket.floors} onChange={(e) => setNewTicket({ ...newTicket, floors: e.target.value })}
              sx={{ mb: 2 }}
            />
          )}

          <TextField
            margin="dense" label="Description" fullWidth multiline rows={4} variant="outlined"
            value={newTicket.description} onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setOpenCreate(false)} color="inherit">Cancel</Button>
          
          {/* REQUIREMENT: Prevents Duplicate Submissions by disabling when submitting */}
          <Button 
            onClick={async () => {
              setIsSubmitting(true);
              await handleCreate();
              setIsSubmitting(false);
            }} 
            variant="contained" 
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(selectedTicket)} onClose={() => setSelectedTicket(null)} fullWidth maxWidth="md">
        {selectedTicket && (
          <>
            <DialogTitle fontWeight="bold">Ticket #{selectedTicket.id}: {selectedTicket.title}</DialogTitle>
            <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Creator: {selectedTicket.client_name}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Assignee: {selectedTicket.current_assignee_name || 'System Auto'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Floors: {selectedTicket.floors || 'N/A'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Status: {selectedTicket.status}</Typography></Grid>
              </Grid>
              <Typography variant="body1" paragraph>{selectedTicket.description}</Typography>
              
              <Divider />
              <Typography variant="h6" fontWeight="bold">Activity & History</Typography>
              <List sx={{ maxHeight: 200, overflow: 'auto', bgcolor: '#f9f9f9', borderRadius: 1, p: 1 }}>
                {selectedTicket.activity_logs && selectedTicket.activity_logs.map((log) => (
                  <ListItem key={log.id} sx={{ mb: 1, bgcolor: log.is_comment ? '#e3f2fd' : '#ffffff', borderRadius: 1, boxShadow: 1 }}>
                    <ListItemText 
                      primary={log.action} 
                      secondary={`${log.performed_by_name || 'System'} • ${new Date(log.created_at).toLocaleString()}`} 
                    />
                  </ListItem>
                ))}
              </List>

              <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <TextField
                  fullWidth size="small" variant="outlined" placeholder="Write a comment or resolution note..."
                  id="action-note" sx={{ mb: 2, bgcolor: 'white' }}
                />
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button 
                    variant="contained" color="secondary" size="small"
                    onClick={() => handleWorkflow(selectedTicket.id, 'add_comment')}
                  >
                    Post Comment
                  </Button>

                  {['OPEN', 'PENDING_TECH_ASSIGNMENT'].includes(selectedTicket.status) && (
                    <>
                      <Button variant="contained" color="primary" size="small" onClick={() => handleWorkflow(selectedTicket.id, 'assign_worker')}>
                        Assign Worker
                      </Button>
                      <Button variant="outlined" color="primary" size="small" onClick={() => handleWorkflow(selectedTicket.id, 'change_department')}>
                        Change Department
                      </Button>
                    </>
                  )}
                  
                  {selectedTicket.status === 'PENDING_TECH_ASSESSMENT' && (
                    <>
                      <Button variant="contained" color="success" size="small" onClick={() => handleWorkflow(selectedTicket.id, 'fully_resolved')}>
                        Mark Fully Resolved
                      </Button>
                      <Button variant="contained" color="warning" size="small" onClick={() => handleWorkflow(selectedTicket.id, 'partially_resolved')}>
                        Mark Partially Resolved
                      </Button>
                      <Button variant="outlined" color="error" size="small" onClick={() => handleWorkflow(selectedTicket.id, 'suggest_change')}>
                        Suggest Worker Change
                      </Button>
                    </>
                  )}
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setSelectedTicket(null)} color="inherit">Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}

export default App;