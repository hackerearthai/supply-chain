// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SupplyChainMaster {
    
    enum Status { Pending, InTransit, Delivered, Delayed, Disputed, Damaged }

    struct Warehouse {
        string location;
        uint256 currentLoad;
        uint256 capacity;
        bool isActive;
        uint256 totalLossEvents; 
        uint256 totalPenaltiesRecovered; // NEW: Tracks money saved for the client
    }

    struct Shipment {
        uint256 orderId;
        string sku;
        uint256 quantity;
        address currentCustodian;
        address destinationWarehouse;
        Status status;
        uint256 eta;
        uint256 actualDeliveryTime;
        bool isLossEvent;
        uint256 penaltyAmount; // NEW: Financial impact of the delay
        uint8 conditionScore;  // NEW: 1-10 (10 being perfect) to track damage loss
    }

    // --- State Variables ---
    address public admin; 
    uint256 public constant PENALTY_PER_DAY = 0.01 ether; // NEW: Example penalty rate
    mapping(address => Warehouse) public warehouses;
    mapping(uint256 => Shipment) public shipments;
    mapping(string => uint256) public globalInventory;
    uint256[] public shipmentIds;

    // --- Events ---
    event InventoryUpdated(string sku, uint256 newBalance);
    event ShipmentAlert(uint256 orderId, string message, uint256 penalty);
    event AuditDiscrepancy(string sku, uint256 expected, uint256 actual, string reason);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not authorized");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // --- 1. Warehouse & Inventory ---

    function registerWarehouse(address _addr, string memory _loc, uint256 _cap) public onlyAdmin {
        warehouses[_addr] = Warehouse(_loc, 0, _cap, true, 0, 0);
    }

    /**
     * @dev NEW: Audit function to identify "Inventory Leaks" (Shrinkage).
     * This is how a middleman proves they are catching internal theft or errors.
     */
    function auditInventory(string memory _sku, uint256 _actualPhysicalCount, string memory _reason) public onlyAdmin {
        uint256 expected = globalInventory[_sku];
        if (_actualPhysicalCount != expected) {
            emit AuditDiscrepancy(_sku, expected, _actualPhysicalCount, _reason);
            globalInventory[_sku] = _actualPhysicalCount;
        }
    }

    function updateStock(string memory _sku, uint256 _amount, bool _isAddition) public onlyAdmin {
        if(_isAddition) {
            globalInventory[_sku] += _amount;
        } else {
            require(globalInventory[_sku] >= _amount, "Shrinkage Error");
            globalInventory[_sku] -= _amount;
        }
        emit InventoryUpdated(_sku, globalInventory[_sku]);
    }

    // --- 2. Enhanced Shipment Logic ---

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
            isLossEvent: false,
            penaltyAmount: 0,
            conditionScore: 10 // Defaults to perfect
        });

        shipmentIds.push(_id);
    }

    function transferCustody(uint256 _id, address _nextHolder) public {
        require(shipments[_id].currentCustodian == msg.sender, "Not the custodian");
        shipments[_id].currentCustodian = _nextHolder;
        shipments[_id].status = Status.InTransit;
    }

    /**
     * @dev UPDATED: Now includes Condition Reporting and Penalty Calculation.
     */
    function confirmDelivery(uint256 _id, uint8 _condition) public {
        Shipment storage s = shipments[_id];
        require(s.destinationWarehouse == msg.sender, "Only destination can confirm");
        require(_condition <= 10, "Invalid score");

        s.actualDeliveryTime = block.timestamp;
        s.conditionScore = _condition;
        
        if (_condition < 7) {
            s.status = Status.Damaged;
            s.isLossEvent = true;
        } else {
            s.status = Status.Delivered;
        }

        // Penalty Logic: Calculate cost of delay
        if (s.actualDeliveryTime > s.eta) {
            s.isLossEvent = true;
            s.status = Status.Delayed;
            
            uint256 daysLate = (s.actualDeliveryTime - s.eta) / 1 days;
            if (daysLate == 0) daysLate = 1; // Minimum 1 day penalty for any delay
            
            s.penaltyAmount = daysLate * PENALTY_PER_DAY;
            warehouses[s.destinationWarehouse].totalLossEvents++;
            warehouses[s.destinationWarehouse].totalPenaltiesRecovered += s.penaltyAmount;

            emit ShipmentAlert(_id, "SLA Breach Detected", s.penaltyAmount);
        }
    }

    // --- 3. UI Helpers ---

    function getWarehouseAuditData(address _wh) public view returns (uint256 losses, uint256 savings) {
        return (warehouses[_wh].totalLossEvents, warehouses[_wh].totalPenaltiesRecovered);
    }
}
