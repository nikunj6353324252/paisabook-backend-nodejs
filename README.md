# Fintrixo Split Groups (Backend)

## Setup
- Ensure Node.js and MongoDB are available.
- Create `.env` with:
  - `MONGODB_URI=...`
  - `JWT_SECRET=...`
  - `PORT=3010` (optional)
- Install dependencies and run:
  - `npm install`
  - `npm run dev`

## Split logic
- Incoming `totalAmount` is parsed as a decimal string/number and converted to minor units (2 decimals).
- Equal split uses integer division; any remainder is distributed by +1 to the first N members in request order.
- Custom split validates each member amount and requires the sum to match `totalAmountMinor`.
- Direction: `expense -> owes`, `income -> gets`.

## Rounding rules
- All calculations are done in minor units (integer).
- `10.01` becomes `1001`.
- Equal split of `1001` across 2 members yields `501` and `500`.

## Tests
- `npm test` runs Jest + supertest with `mongodb-memory-server`.
