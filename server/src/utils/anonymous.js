import { v4 as uuidv4 } from 'uuid';

export function generateAnonymousId() {
  return uuidv4();
}

export function getAnonymousIdFromRequest(req) {
  // Try to get from header first (for API clients)
  const headerId = req.headers['x-anonymous-id'];
  if (headerId) return headerId;

  // Try to get from query param (for browser clients)
  const queryId = req.query.anonymous_id;
  if (queryId) return queryId;

  // Generate new one if none provided
  return generateAnonymousId();
}
