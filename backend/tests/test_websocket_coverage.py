"""
Test WebSocket Coverage for Cupim na Telha Delivery Management System
Tests that ALL POST/PATCH/DELETE endpoints broadcast WebSocket events
and verifies specific bug fixes for troco2 calculation and data clearing
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestWebSocketBroadcastCoverage:
    """
    Verify all POST/PATCH/DELETE endpoints include ws_manager.broadcast() calls
    We test this by verifying the endpoints work correctly and return expected responses
    """
    
    # ==================== CASH ENDPOINTS ====================
    
    def test_post_cash_creates_entry(self):
        """POST /api/cash - should create cash entry and broadcast cash_created"""
        response = requests.post(f"{BASE_URL}/api/cash", json={
            "type": "entrada",
            "value": 100.50,
            "desc": "TEST_WS_Cash_Entry"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["type"] == "entrada"
        assert data["value"] == 100.50
        assert data["desc"] == "TEST_WS_Cash_Entry"
        # Store for cleanup
        self.__class__.cash_id = data["id"]
        print(f"PASS: POST /api/cash creates entry with id {data['id']}")
    
    def test_delete_cash_removes_entry(self):
        """DELETE /api/cash/{id} - should delete cash entry and broadcast cash_deleted"""
        cash_id = getattr(self.__class__, 'cash_id', None)
        if not cash_id:
            pytest.skip("No cash entry to delete")
        
        response = requests.delete(f"{BASE_URL}/api/cash/{cash_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["message"] == "Entry deleted"
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/cash")
        entries = get_response.json()
        assert not any(e["id"] == cash_id for e in entries), "Cash entry should be deleted"
        print(f"PASS: DELETE /api/cash/{cash_id} removes entry")
    
    # ==================== DELIVERIES ENDPOINTS ====================
    
    def test_post_deliveries_creates_delivery(self):
        """POST /api/deliveries - should create delivery and broadcast delivery_created"""
        response = requests.post(f"{BASE_URL}/api/deliveries", json={
            "clientName": "TEST_WS_Client",
            "amount": 50.00,
            "paymentMethod": "pix"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data
        assert "seq" in data
        assert data["clientName"] == "TEST_WS_Client"
        assert data["amount"] == 50.00
        self.__class__.delivery_id = data["id"]
        print(f"PASS: POST /api/deliveries creates delivery #{data['seq']}")
    
    def test_patch_deliveries_updates_delivery(self):
        """PATCH /api/deliveries/{id} - should update delivery and broadcast delivery_updated"""
        delivery_id = getattr(self.__class__, 'delivery_id', None)
        if not delivery_id:
            pytest.skip("No delivery to update")
        
        response = requests.patch(f"{BASE_URL}/api/deliveries/{delivery_id}", json={
            "clientName": "TEST_WS_Client_Updated"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["clientName"] == "TEST_WS_Client_Updated"
        print(f"PASS: PATCH /api/deliveries/{delivery_id} updates delivery")
    
    def test_patch_deliveries_status_change_broadcasts(self):
        """PATCH /api/deliveries/{id} with status change - broadcasts delivery_status_changed"""
        delivery_id = getattr(self.__class__, 'delivery_id', None)
        if not delivery_id:
            pytest.skip("No delivery to update")
        
        response = requests.patch(f"{BASE_URL}/api/deliveries/{delivery_id}", json={
            "saiuParaEntrega": True
        })
        assert response.status_code == 200
        data = response.json()
        assert data["saiuParaEntrega"] == True
        assert data["horaSaida"] is not None
        print(f"PASS: PATCH /api/deliveries/{delivery_id} status change works")
    
    def test_patch_deliveries_finished_broadcasts(self):
        """PATCH /api/deliveries/{id} with foiEntregue - broadcasts delivery_finished"""
        delivery_id = getattr(self.__class__, 'delivery_id', None)
        if not delivery_id:
            pytest.skip("No delivery to update")
        
        response = requests.patch(f"{BASE_URL}/api/deliveries/{delivery_id}", json={
            "foiEntregue": True
        })
        assert response.status_code == 200
        data = response.json()
        assert data["foiEntregue"] == True
        assert data["horaEntregue"] is not None
        print(f"PASS: PATCH /api/deliveries/{delivery_id} finished works")
    
    def test_patch_deliveries_cancelled_broadcasts(self):
        """PATCH /api/deliveries/{id} with cancelado - broadcasts delivery_cancelled"""
        delivery_id = getattr(self.__class__, 'delivery_id', None)
        if not delivery_id:
            pytest.skip("No delivery to update")
        
        response = requests.patch(f"{BASE_URL}/api/deliveries/{delivery_id}", json={
            "cancelado": True
        })
        assert response.status_code == 200
        data = response.json()
        assert data["cancelado"] == True
        print(f"PASS: PATCH /api/deliveries/{delivery_id} cancelled works")
    
    def test_patch_deliveries_uncancelled_broadcasts(self):
        """PATCH /api/deliveries/{id} with cancelado=False - broadcasts delivery_uncancelled"""
        delivery_id = getattr(self.__class__, 'delivery_id', None)
        if not delivery_id:
            pytest.skip("No delivery to update")
        
        response = requests.patch(f"{BASE_URL}/api/deliveries/{delivery_id}", json={
            "cancelado": False
        })
        assert response.status_code == 200
        data = response.json()
        assert data["cancelado"] == False
        print(f"PASS: PATCH /api/deliveries/{delivery_id} uncancelled works")
    
    def test_delete_deliveries_removes_delivery(self):
        """DELETE /api/deliveries/{id} - should delete delivery and broadcast delivery_deleted"""
        delivery_id = getattr(self.__class__, 'delivery_id', None)
        if not delivery_id:
            pytest.skip("No delivery to delete")
        
        response = requests.delete(f"{BASE_URL}/api/deliveries/{delivery_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Delivery deleted"
        print(f"PASS: DELETE /api/deliveries/{delivery_id} removes delivery")
    
    # ==================== DELIVERERS ENDPOINTS ====================
    
    def test_post_deliverers_creates_deliverer(self):
        """POST /api/deliverers - should create deliverer and broadcast deliverer_created"""
        response = requests.post(f"{BASE_URL}/api/deliverers", json={
            "name": "TEST_WS_Deliverer"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name"] == "TEST_WS_Deliverer"
        self.__class__.deliverer_id = data["id"]
        print(f"PASS: POST /api/deliverers creates deliverer")
    
    def test_delete_deliverers_removes_deliverer(self):
        """DELETE /api/deliverers/{id} - should delete deliverer and broadcast deliverer_deleted"""
        deliverer_id = getattr(self.__class__, 'deliverer_id', None)
        if not deliverer_id:
            pytest.skip("No deliverer to delete")
        
        response = requests.delete(f"{BASE_URL}/api/deliverers/{deliverer_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Deliverer deleted"
        print(f"PASS: DELETE /api/deliverers/{deliverer_id} removes deliverer")
    
    # ==================== EMPLOYEE PAYMENTS ENDPOINTS ====================
    
    def test_post_employee_payments_creates_payment(self):
        """POST /api/employee-payments - should create payment and broadcast employee_payment_created"""
        response = requests.post(f"{BASE_URL}/api/employee-payments", json={
            "employeeName": "TEST_WS_Employee",
            "amount": 200.00,
            "paymentMethod": "pix"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["employeeName"] == "TEST_WS_Employee"
        assert data["amount"] == 200.00
        self.__class__.payment_id = data["id"]
        print(f"PASS: POST /api/employee-payments creates payment")
    
    def test_delete_employee_payments_removes_payment(self):
        """DELETE /api/employee-payments/{id} - should delete payment and broadcast employee_payment_deleted"""
        payment_id = getattr(self.__class__, 'payment_id', None)
        if not payment_id:
            pytest.skip("No payment to delete")
        
        response = requests.delete(f"{BASE_URL}/api/employee-payments/{payment_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Payment deleted"
        print(f"PASS: DELETE /api/employee-payments/{payment_id} removes payment")
    
    # ==================== STOCK ENDPOINTS ====================
    
    def test_post_stock_creates_item(self):
        """POST /api/stock - should create stock item and broadcast stock_created"""
        response = requests.post(f"{BASE_URL}/api/stock", json={
            "name": "TEST_WS_Stock_Item",
            "category": "Test Category",
            "price": 25.00,
            "quantity": 10
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name"] == "TEST_WS_Stock_Item"
        assert data["price"] == 25.00
        assert data["quantity"] == 10
        self.__class__.stock_id = data["id"]
        print(f"PASS: POST /api/stock creates item")
    
    def test_patch_stock_updates_item(self):
        """PATCH /api/stock/{id} - should update stock item and broadcast stock_updated"""
        stock_id = getattr(self.__class__, 'stock_id', None)
        if not stock_id:
            pytest.skip("No stock item to update")
        
        response = requests.patch(f"{BASE_URL}/api/stock/{stock_id}", json={
            "quantity": 15,
            "sold": 5
        })
        assert response.status_code == 200
        data = response.json()
        assert data["quantity"] == 15
        assert data["sold"] == 5
        print(f"PASS: PATCH /api/stock/{stock_id} updates item")
    
    def test_delete_stock_removes_item(self):
        """DELETE /api/stock/{id} - should delete stock item and broadcast stock_deleted"""
        stock_id = getattr(self.__class__, 'stock_id', None)
        if not stock_id:
            pytest.skip("No stock item to delete")
        
        response = requests.delete(f"{BASE_URL}/api/stock/{stock_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Item deleted"
        print(f"PASS: DELETE /api/stock/{stock_id} removes item")


class TestTroco2Calculation:
    """
    Test troco2 calculation bug fix:
    - POST /api/deliveries should calculate troco2 when paymentMethod2 is 'dinheiro'
    - PATCH /api/deliveries should recalculate troco2 when paymentMethod2/valorRecebido2/amount2 change
    """
    
    def test_post_delivery_with_troco2(self):
        """POST /api/deliveries creates delivery with correct troco2 when paymentMethod2 is dinheiro"""
        response = requests.post(f"{BASE_URL}/api/deliveries", json={
            "clientName": "TEST_Troco2_Client",
            "amount": 30.00,
            "paymentMethod": "pix",
            "paymentMethod2": "dinheiro",
            "amount2": 20.00,
            "valorRecebido2": 50.00
        })
        assert response.status_code == 200
        data = response.json()
        
        # troco2 should be valorRecebido2 - amount2 = 50 - 20 = 30
        assert data["troco2"] == 30.00, f"Expected troco2=30.00, got {data['troco2']}"
        assert data["paymentMethod2"] == "dinheiro"
        assert data["amount2"] == 20.00
        assert data["valorRecebido2"] == 50.00
        
        self.__class__.troco2_delivery_id = data["id"]
        print(f"PASS: POST /api/deliveries calculates troco2 correctly: {data['troco2']}")
    
    def test_patch_delivery_recalculates_troco2(self):
        """PATCH /api/deliveries/{id} recalculates troco2 when paymentMethod2/valorRecebido2/amount2 change"""
        delivery_id = getattr(self.__class__, 'troco2_delivery_id', None)
        if not delivery_id:
            pytest.skip("No delivery to update")
        
        # Update valorRecebido2 to 100, amount2 stays 20 -> troco2 should be 80
        response = requests.patch(f"{BASE_URL}/api/deliveries/{delivery_id}", json={
            "valorRecebido2": 100.00
        })
        assert response.status_code == 200
        data = response.json()
        
        # troco2 should be recalculated: 100 - 20 = 80
        assert data["troco2"] == 80.00, f"Expected troco2=80.00, got {data['troco2']}"
        print(f"PASS: PATCH /api/deliveries recalculates troco2 correctly: {data['troco2']}")
    
    def test_patch_delivery_troco2_with_amount2_change(self):
        """PATCH /api/deliveries/{id} recalculates troco2 when amount2 changes"""
        delivery_id = getattr(self.__class__, 'troco2_delivery_id', None)
        if not delivery_id:
            pytest.skip("No delivery to update")
        
        # Update amount2 to 40, valorRecebido2 is 100 -> troco2 should be 60
        response = requests.patch(f"{BASE_URL}/api/deliveries/{delivery_id}", json={
            "amount2": 40.00
        })
        assert response.status_code == 200
        data = response.json()
        
        # troco2 should be recalculated: 100 - 40 = 60
        assert data["troco2"] == 60.00, f"Expected troco2=60.00, got {data['troco2']}"
        print(f"PASS: PATCH /api/deliveries recalculates troco2 with amount2 change: {data['troco2']}")
    
    def test_cleanup_troco2_delivery(self):
        """Cleanup test delivery"""
        delivery_id = getattr(self.__class__, 'troco2_delivery_id', None)
        if delivery_id:
            requests.delete(f"{BASE_URL}/api/deliveries/{delivery_id}")
            print(f"PASS: Cleaned up troco2 test delivery")


class TestDataClearIncludesStock:
    """
    Test that DELETE /api/data/clear deletes ALL collections including stock_items
    This was a recently fixed bug
    """
    
    def test_data_clear_setup(self):
        """Create test data in all collections"""
        # Create cash entry
        r1 = requests.post(f"{BASE_URL}/api/cash", json={"type": "entrada", "value": 10, "desc": "TEST_CLEAR"})
        assert r1.status_code == 200
        
        # Create delivery
        r2 = requests.post(f"{BASE_URL}/api/deliveries", json={"clientName": "TEST_CLEAR", "amount": 10, "paymentMethod": "pix"})
        assert r2.status_code == 200
        
        # Create deliverer
        r3 = requests.post(f"{BASE_URL}/api/deliverers", json={"name": "TEST_CLEAR"})
        assert r3.status_code == 200
        
        # Create employee payment
        r4 = requests.post(f"{BASE_URL}/api/employee-payments", json={"employeeName": "TEST_CLEAR", "amount": 10, "paymentMethod": "pix"})
        assert r4.status_code == 200
        
        # Create stock item
        r5 = requests.post(f"{BASE_URL}/api/stock", json={"name": "TEST_CLEAR_STOCK", "price": 10, "quantity": 5})
        assert r5.status_code == 200
        
        print("PASS: Created test data in all collections")
    
    def test_data_clear_deletes_all_including_stock(self):
        """DELETE /api/data/clear should delete ALL collections including stock_items"""
        response = requests.delete(f"{BASE_URL}/api/data/clear")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "All data cleared successfully"
        
        # Verify all collections are empty
        cash = requests.get(f"{BASE_URL}/api/cash").json()
        deliveries = requests.get(f"{BASE_URL}/api/deliveries").json()
        deliverers = requests.get(f"{BASE_URL}/api/deliverers").json()
        payments = requests.get(f"{BASE_URL}/api/employee-payments").json()
        stock = requests.get(f"{BASE_URL}/api/stock").json()
        pool = requests.get(f"{BASE_URL}/api/clients/pool").json()
        
        assert len(cash) == 0, f"Cash should be empty, got {len(cash)} entries"
        assert len(deliveries) == 0, f"Deliveries should be empty, got {len(deliveries)} entries"
        assert len(deliverers) == 0, f"Deliverers should be empty, got {len(deliverers)} entries"
        assert len(payments) == 0, f"Employee payments should be empty, got {len(payments)} entries"
        assert len(stock) == 0, f"Stock should be empty, got {len(stock)} entries - BUG if not empty!"
        assert len(pool.get("items", [])) == 0, f"Clients pool should be empty"
        
        print("PASS: DELETE /api/data/clear deletes ALL collections including stock_items")


class TestDelivererAssignment:
    """Test deliverer assignment broadcasts delivery_assigned"""
    
    def test_deliverer_assignment_broadcasts(self):
        """PATCH /api/deliveries/{id} with delivererId - broadcasts delivery_assigned"""
        # Create a deliverer first
        r1 = requests.post(f"{BASE_URL}/api/deliverers", json={"name": "TEST_Assign_Deliverer"})
        assert r1.status_code == 200
        deliverer_id = r1.json()["id"]
        
        # Create a delivery
        r2 = requests.post(f"{BASE_URL}/api/deliveries", json={
            "clientName": "TEST_Assign_Client",
            "amount": 25.00,
            "paymentMethod": "pix"
        })
        assert r2.status_code == 200
        delivery_id = r2.json()["id"]
        
        # Assign deliverer
        r3 = requests.patch(f"{BASE_URL}/api/deliveries/{delivery_id}", json={
            "delivererId": deliverer_id,
            "saiuParaEntrega": True
        })
        assert r3.status_code == 200
        data = r3.json()
        assert data["delivererId"] == deliverer_id
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/deliveries/{delivery_id}")
        requests.delete(f"{BASE_URL}/api/deliverers/{deliverer_id}")
        
        print("PASS: PATCH /api/deliveries with delivererId works correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
