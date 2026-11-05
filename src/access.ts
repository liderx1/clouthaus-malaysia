import type { Access } from 'payload'

// Who may read what through the public REST API (/api/...). The website itself reads content on the server
// (src/lib/content.ts), so these rules only decide what a stranger calling the API can see.

/** editors see everything, drafts included; everyone else only what is published */
export const publishedOrEditor: Access = ({ req }) => (req.user ? true : { _status: { equals: 'published' } })

/** logged-in editors only */
export const editorsOnly: Access = ({ req }) => !!req.user
