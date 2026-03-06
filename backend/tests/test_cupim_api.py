"""
Backend API Tests for Cupim na Telha Delivery Management System
Tests: Health, CRUD operations, Backup endpoint
"""
import pytest
import requests
import os
import io
import zipfile
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndRoot:
    """Basic API health checks"""
    
    def test_root_endpoint(self):
        """Test root API endpoint returns correct message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Cupim na Telha" in data["message"]
        print(f"✅ Root endpoint working: {data}")

class TestCashEndpoints:
    """Cash entry CRUD tests"""
    
    def test_create_cash_entry(self):
        """Create a cash entry and verify it exists"""
        payload = {"type": "entrada", "value": 100.50, "desc": "TEST_Cash entry"}
        response = requests.post(f"{BASE_URL}/api/cash", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "entrada"
        assert data["value"] == 100.50
        assert "id" in data
        print(f"✅ Created cash entry: {data['id']}")
        
        # Verify it appears in list
        list_response = requests.get(f"{BASE_URL}/api/cash")
        assert list_response.status_code == 200
        entries = list_response.json()
        found = any(e["id"] == data["id"] for e in entries)
        assert found, "Created entry not found in list"
        
        # Cleanup
        del_response = requests.delete(f"{BASE_URL}/api/cash/{data['id']}")
        assert del_response.status_code == 200
        print(f"✅ Cash entry deleted")

    def test_get_cash_entries(self):
        """Test listing all cash entries"""
        response = requests.get(f"{BASE_URL}/api/cash")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print(f"✅ Cash entries list returned {len(response.json())} items")

class TestDeliveryEndpoints:
    """Delivery CRUD tests"""
    
    def test_create_delivery(self):
        """Create a delivery and verify it exists"""
        payload = {
            "clientName": "TEST_Client",
            "amount": 50.00,
            "paymentMethod": "pix",
            "observation": "Test delivery"
        }
        response = requests.post(f"{BASE_URL}/api/deliveries", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["clientName"] == "TEST_Client"
        assert data["amount"] == 50.00
        assert data["paymentMethod"] == "pix"
        assert "id" in data
        assert "seq" in data
        print(f"✅ Created delivery #{data['seq']}: {data['id']}")
        
        # Store for cleanup
        delivery_id = data["id"]
        
        # Verify it appears in list
        list_response = requests.get(f"{BASE_URL}/api/deliveries")
        assert list_response.status_code == 200
        found = any(d["id"] == delivery_id for d in list_response.json())
        assert found, "Created delivery not found in list"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/deliveries/{delivery_id}")
        print(f"✅ Delivery deleted")
        
    def test_get_deliveries(self):
        """Test listing all deliveries"""
        response = requests.get(f"{BASE_URL}/api/deliveries")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print(f"✅ Deliveries list returned {len(response.json())} items")

    def test_update_delivery_status(self):
        """Create, update status, and verify"""
        # Create
        create_response = requests.post(f"{BASE_URL}/api/deliveries", json={
            "clientName": "TEST_Status_Update",
            "amount": 30.00,
            "paymentMethod": "cartao"
        })
        assert create_response.status_code == 200
        delivery_id = create_response.json()["id"]
        
        # Update to "out for delivery"
        update_response = requests.patch(f"{BASE_URL}/api/deliveries/{delivery_id}", json={
            "saiuParaEntrega": True
        })
        assert update_response.status_code == 200
        assert update_response.json()["saiuParaEntrega"] == True
        assert update_response.json()["horaSaida"] is not None
        print(f"✅ Delivery status updated to 'out for delivery'")
        
        # Update to delivered
        update2_response = requests.patch(f"{BASE_URL}/api/deliveries/{delivery_id}", json={
            "foiEntregue": True
        })
        assert update2_response.status_code == 200
        assert update2_response.json()["foiEntregue"] == True
        assert update2_response.json()["horaEntregue"] is not None
        print(f"✅ Delivery status updated to 'delivered'")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/deliveries/{delivery_id}")

class TestDelivererEndpoints:
    """Deliverer CRUD tests"""
    
    def test_create_deliverer(self):
        """Create a deliverer and verify"""
        payload = {"name": "TEST_Deliverer"}
        response = requests.post(f"{BASE_URL}/api/deliverers", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TEST_Deliverer"
        assert "id" in data
        print(f"✅ Created deliverer: {data['id']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/deliverers/{data['id']}")

    def test_get_deliverers(self):
        """Test listing deliverers"""
        response = requests.get(f"{BASE_URL}/api/deliverers")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print(f"✅ Deliverers list returned {len(response.json())} items")

class TestEmployeePaymentEndpoints:
    """Employee payment CRUD tests"""
    
    def test_create_employee_payment(self):
        """Create employee payment and verify"""
        payload = {
            "employeeName": "TEST_Employee",
            "amount": 200.00,
            "paymentMethod": "pix"
        }
        response = requests.post(f"{BASE_URL}/api/employee-payments", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["employeeName"] == "TEST_Employee"
        assert data["amount"] == 200.00
        assert "id" in data
        print(f"✅ Created employee payment: {data['id']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/employee-payments/{data['id']}")

    def test_get_employee_payments(self):
        """Test listing employee payments"""
        response = requests.get(f"{BASE_URL}/api/employee-payments")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print(f"✅ Employee payments list returned {len(response.json())} items")

class TestBackupEndpoint:
    """Backup endpoint tests - CRITICAL NEW FEATURE"""
    
    def test_backup_with_valid_date(self):
        """Test POST /api/backup returns valid ZIP with 5 files"""
        today = datetime.now().strftime("%Y-%m-%d")
        response = requests.post(f"{BASE_URL}/api/backup", json={"date": today})
        
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/zip"
        
        # Verify it's a valid ZIP
        zip_content = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_content, 'r') as zf:
            file_list = zf.namelist()
            print(f"✅ ZIP contains {len(file_list)} files: {file_list}")
            
            # Should have 5 files: 1 xlsx + 4 pdfs
            assert len(file_list) == 5, f"Expected 5 files, got {len(file_list)}"
            
            # Check for xlsx
            xlsx_files = [f for f in file_list if f.endswith('.xlsx')]
            assert len(xlsx_files) == 1, "Should have exactly 1 Excel file"
            
            # Check for pdfs  
            pdf_files = [f for f in file_list if f.endswith('.pdf')]
            assert len(pdf_files) == 4, f"Should have 4 PDF files, got {len(pdf_files)}"
            
            print(f"✅ Backup ZIP structure verified: 1 xlsx + 4 pdfs")
    
    def test_backup_with_invalid_date_format(self):
        """Test POST /api/backup with invalid date format returns error"""
        response = requests.post(f"{BASE_URL}/api/backup", json={"date": "invalid-date"})
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"✅ Invalid date format correctly rejected: {data['detail']}")
    
    def test_backup_with_past_date(self):
        """Test backup with a past date (may have no data)"""
        response = requests.post(f"{BASE_URL}/api/backup", json={"date": "2020-01-01"})
        assert response.status_code == 200
        
        # Even with no data, should still return valid ZIP
        zip_content = io.BytesIO(response.content)
        with zipfile.ZipFile(zip_content, 'r') as zf:
            file_list = zf.namelist()
            assert len(file_list) == 5
            print(f"✅ Past date backup works (may have empty tables)")

class TestExportEndpoints:
    """Export functionality tests"""
    
    def test_export_excel(self):
        """Test Excel export endpoint"""
        response = requests.get(f"{BASE_URL}/api/export/excel")
        assert response.status_code == 200
        assert "spreadsheet" in response.headers.get("content-type", "")
        print(f"✅ Excel export working")
    
    def test_export_summary_pdf(self):
        """Test summary PDF export"""
        response = requests.get(f"{BASE_URL}/api/export/summary-pdf")
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"
        print(f"✅ Summary PDF export working")
    
    def test_export_reports_pdf(self):
        """Test reports PDF export"""
        response = requests.get(f"{BASE_URL}/api/export/reports-pdf")
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"
        print(f"✅ Reports PDF export working")
    
    def test_export_employees_pdf(self):
        """Test employees PDF export"""
        response = requests.get(f"{BASE_URL}/api/export/employees-pdf")
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"
        print(f"✅ Employees PDF export working")

class TestClientsPool:
    """Clients pool endpoint test"""
    
    def test_get_clients_pool(self):
        """Test clients pool endpoint"""
        response = requests.get(f"{BASE_URL}/api/clients/pool")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert isinstance(data["items"], list)
        print(f"✅ Clients pool returned {len(data['items'])} items")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
