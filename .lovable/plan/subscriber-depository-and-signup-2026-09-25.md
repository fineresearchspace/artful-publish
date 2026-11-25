# Subscriber depository and signup

## What will be built
- Keep subscriber email addresses in the existing private subscriber store, readable and manageable only by the signed-in admin.
- Add a newsletter signup form to the public site footer; valid submissions will be normalized, deduplicated, and stored as active subscribers.
- Import the valid unique email addresses from the uploaded CSV and label them as imported from the existing mailing list.
- Add a subscriber-list page in the private studio so the current audience can be reviewed.

## Technical details
- Use a validated server action for public signups so the subscriber table itself is never publicly readable.
- Treat repeated signups as success and reactivate a previously unsubscribed matching address without exposing whether an address already exists.
- Import only email, original signup date, and source; do not store revenue or activity fields from the export.
- Preserve row-level access controls and avoid placing email addresses in project source files.
