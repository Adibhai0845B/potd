# Implement Username Locking After Earning Points

## Tasks
- [ ] Update Completion model to include platformUsername field
- [ ] Modify award.ts to populate platformUsername when recording completion
- [ ] Add validation in user.ts PATCH /profile to prevent username changes if completions exist with current username
- [ ] Test the functionality to ensure usernames are locked after first award
