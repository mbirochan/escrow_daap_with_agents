import asyncio
import logging
from typing import Dict, List
from ..utils.external_apis import ExternalAPIs
from ..config import Config

logger = logging.getLogger(__name__)

class ConditionMonitor:
    def __init__(self):
        self.active_monitors: Dict[str, asyncio.Task] = {}
    
    async def start_monitoring(self, escrow_id: str, verifiables: List[Dict]):
        """Start monitoring verifiable conditions for an escrow"""
        if escrow_id in self.active_monitors:
            logger.warning(f"Already monitoring escrow {escrow_id}")
            return
        
        monitor_task = asyncio.create_task(
            self._monitor_conditions(escrow_id, verifiables)
        )
        self.active_monitors[escrow_id] = monitor_task
    
    async def stop_monitoring(self, escrow_id: str):
        """Stop monitoring verifiable conditions for an escrow"""
        if escrow_id in self.active_monitors:
            self.active_monitors[escrow_id].cancel()
            del self.active_monitors[escrow_id]
    
    async def _monitor_conditions(self, escrow_id: str, verifiables: List[Dict]):
        """Continuously monitor verifiable conditions"""
        while True:
            try:
                all_conditions_met = await self._check_all_conditions(verifiables)
                if all_conditions_met:
                    await self._trigger_fund_release(escrow_id)
                    break
                
                await asyncio.sleep(Config.POLLING_INTERVAL)
            except asyncio.CancelledError:
                logger.info(f"Monitoring stopped for escrow {escrow_id}")
                break
            except Exception as e:
                logger.error(f"Error monitoring escrow {escrow_id}: {str(e)}")
                await asyncio.sleep(Config.POLLING_INTERVAL)
    
    async def _check_all_conditions(self, verifiables: List[Dict]) -> bool:
        """Check if all verifiable conditions are met"""
        for verifiable in verifiables:
            condition_type = verifiable["type"]
            
            try:
                if condition_type == "shipment":
                    status = await ExternalAPIs.check_shipment_status(
                        verifiable["tracking_id"],
                        verifiable["provider"]
                    )
                    if status["status"] != "delivered":
                        return False
                
                elif condition_type == "document":
                    verification = await ExternalAPIs.verify_document(
                        verifiable["document_hash"]
                    )
                    if not verification["verified"]:
                        return False
                
                elif condition_type == "email":
                    confirmation = await ExternalAPIs.check_email_confirmation(
                        verifiable["email_id"]
                    )
                    if confirmation["status"] != "confirmed":
                        return False
                
                elif condition_type == "oracle":
                    data = await ExternalAPIs.get_oracle_data(
                        verifiable["oracle_id"]
                    )
                    if not self._validate_oracle_data(data, verifiable["expected_value"]):
                        return False
            
            except Exception as e:
                logger.error(f"Error checking condition {condition_type}: {str(e)}")
                return False
        
        return True
    
    def _validate_oracle_data(self, data: Dict, expected_value: str) -> bool:
        """Validate oracle data against expected value"""
        return data["value"] == expected_value
    
    async def _trigger_fund_release(self, escrow_id: str):
        """Trigger fund release in the smart contract"""
        # Implementation would interact with the blockchain
        # This is a placeholder for the actual implementation
        logger.info(f"All conditions met for escrow {escrow_id}. Triggering fund release.") 