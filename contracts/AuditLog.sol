// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AuditLog {
    event IncidentLogged(bytes32 indexed hash, uint256 timestamp);

    function logIncident(bytes32 hash) external {
        emit IncidentLogged(hash, block.timestamp);
    }
}