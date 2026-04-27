# Smart Inventory & Logistics Auditor

Solidity-based smart contract designed for a **Middleman/3PL business model**. It transforms a standard supply chain tracker into a powerful audit tool that cuts losses, ensures accountability, and maximizes profitability through automated SLA enforcement.

## 🚀 Key Features

### 1. Automated SLA Enforcement (Profitability Engine)
The contract automatically audits delivery times against the agreed-upon ETA.
- **Auto-Penalty:** Calculates financial penalties for late deliveries based on a daily rate.
- **Loss Tracking:** Flags shipments as `isLossEvent` if they breach time or condition constraints.
- **Revenue Recovery:** Tracks total penalties recovered per warehouse to prove ROI to the client.


### 2. Inventory Loss Prevention (Shrinkage Audit)
Beyond simple tracking, the contract provides a dedicated audit mechanism to identify "Inventory Leaks."
- **Audit Discrepancy:** Allows middlemen to log physical vs. digital stock differences.
- **Immutable Ledger:** Creates a permanent trail of stock adjustments to identify exactly where and why inventory is disappearing.

### 3. Custody & Liability Handshake
- **Ownership Transfer:** Every hand-off (from warehouse to transporter to destination) requires a signed transaction.
- **Digital Provenance:** Records the `currentCustodian` at every stage, identifying exactly who was responsible if goods are lost or damaged.

### 4. Quality Control
- **Condition Scoring:** Deliveries are rated on a scale of 1-10 upon arrival.
- **Damage Alerts:** Automatic status updates to `Damaged` if the condition score falls below the threshold 


## 🛠 Smart Contract Functionalities

### Warehouse Management
- `registerWarehouse(address _addr, string _loc, uint256 _cap)`: Registers a physical node in the network with capacity limits.

### Inventory Control
- `updateStock(string _sku, uint256 _amount, bool _isAddition)`: Basic stock entry/exit logic.
- `auditInventory(string _sku, uint256 _actualCount, string _reason)`: Reconciles digital data with physical audits to detect shrinkage.

### Shipment Lifecycle
- `createShipment(uint256 _id, string _sku, uint256 _qty, address _toWH, uint256 _etaDays)`: Initializes an audited shipment with a fixed ETA.
- `transferCustody(uint256 _id, address _nextHolder)`: Formally signs off responsibility to the next party in the chain.
- `confirmDelivery(uint256 _id, uint8 _condition)`: The final audit point; automatically calculates penalties and rates quality.

### Data Helpers (UI Integration)
- `getDashboardStats()`: Returns total and active shipment counts for frontend KPI cards.
- `getWarehouseAuditData(address _wh)`: Returns performance (Loss Events) and savings (Penalties Recovered) for a specific node.

---

## 📦 Tech Stack Integration

- **Blockchain:** Polygon Amoy Testnet (EVM).
- **Frontend:** Next.js (interacting via `ethers.js` or `wagmi`).
- **Backend:** Node.js listening for `AuditDiscrepancy` and `ShipmentAlert` events to trigger AI-driven recommendations.

---

## 📜 Deployment & Development

- **Compiler:** Solidity 0.8.34+
- **Framework:** Hardhat / Foundry / Remix
- **Network:** Polygon Amoy
- **Gas Token:** POL (Testnet)

## 📝 License
This project is licensed under the MIT License.
