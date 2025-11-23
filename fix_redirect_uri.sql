-- Fix redirect URI mismatch for client
-- Update the redirect_uri to match what your client app is sending

UPDATE clients
SET redirect_uri = 'http://localhost:3001/api/callback'
WHERE client_id = 'c30b03b35a608c161d041bacf4771bf3';

-- Verify the update
SELECT client_id, name, redirect_uri, status 
FROM clients 
WHERE client_id = 'c30b03b35a608c161d041bacf4771bf3';

