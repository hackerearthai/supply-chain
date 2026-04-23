// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

contract supplychain {
    
    enum Status { Pending, InTransit, Delivered, Delayed, Disputed }

    // --- Data Structures ---

    struct Warehouse {
        string location;
        uint256 currentLoad;
        uint256 capacity;
        bool isActive;
        uint256 totalLossEvents; // Tracks warehouse performance
    }

    struct Shipment {
        uint256 orderId;
        string sku;
        uint256 quantity;
        address currentCustodian; // Wallet of the person/warehouse holding it
        address destinationWarehouse;
        Status status;
        uint256 eta;
        uint256 actualDeliveryTime;
        bool isLossEvent; // Flag for profitability audit
    }

    // --- State Variables ---

    address public admin; 
    mapping(address => Warehouse) public warehouses;
    mapping(uint256 => Shipment) public shipments;
    mapping(string => uint256) public globalInventory; // SKU => Total Stock
    uint256[] public shipmentIds;

    // --- Events ---

    event InventoryUpdated(string sku, uint256 newBalance);
    event ShipmentAlert(uint256 orderId, string message);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not authorized");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // --- 1. Warehouse Functionalities ---

    function registerWarehouse(address _addr, string memory _loc, uint256 _cap) public onlyAdmin {
        warehouses[_addr] = Warehouse(_loc, 0, _cap, true, 0);
    }

    // --- 2. Inventory Functionalities (Loss Prevention) ---

    function updateStock(string memory _sku, uint256 _amount, bool _isAddition) public onlyAdmin {
        if(_isAddition) {
            globalInventory[_sku] += _amount;
        } else {
            require(globalInventory[_sku] >= _amount, "Shrinkage Error: Physical stock lower than ledger");
            globalInventory[_sku] -= _amount;
        }
        emit InventoryUpdated(_sku, globalInventory[_sku]);
    }

    // --- 3. Shipment Functionalities (SLA Enforcement) ---

    function createShipment(
        uint256 _id, 
        string memory _sku, 
        uint256 _qty, 
        address _toWH, 
        uint256 _etaDays
    ) public onlyAdmin {
        uint256 etaTimestamp = block.timestamp + (_etaDays * 1 days);
        
        shipments[_id] = Shipment({
            orderId: _id,
            sku: _sku,
            quantity: _qty,
            currentCustodian: msg.sender,
            destinationWarehouse: _toWH,
            status: Status.Pending,
            eta: etaTimestamp,
            actualDeliveryTime: 0,
            isLossEvent: false
        });

        shipmentIds.push(_id);
    }

    /**
     * @dev Hand-off mechanism: Proves who is liable for the goods at any time.
     */
    function transferCustody(uint256 _id, address _nextHolder) public {
        require(shipments[_id].currentCustodian == msg.sender, "Not the current custodian");
        shipments[_id].currentCustodian = _nextHolder;
        shipments[_id].status = Status.InTransit;
    }

    /**
     * @dev Final delivery and automatic Audit of Performance.
     */
    function confirmDelivery(uint256 _id) public {
        Shipment storage s = shipments[_id];
        require(s.destinationWarehouse == msg.sender, "Only destination warehouse can confirm");

        s.actualDeliveryTime = block.timestamp;
        s.status = Status.Delivered;

        // Middleman Logic: If late, mark as loss event to hold logistics provider accountable
        if (s.actualDeliveryTime > s.eta) {
            s.isLossEvent = true;
            s.status = Status.Delayed;
            warehouses[s.destinationWarehouse].totalLossEvents++;
            emit ShipmentAlert(_id, "SLA Violation: Late Delivery Detected");
        }
    }

    // --- 4. Dashboard Helpers ---

    function getDashboardStats() public view returns (uint256 total, uint256 active) {
        total = shipmentIds.length;
        uint256 count = 0;
        for(uint i = 0; i < total; i++) {
            if(shipments[shipmentIds[i]].status == Status.InTransit) count++;
        }
        return (total, count);
    }
}
