import requests
import sys
import json
from datetime import datetime

class DeliverySystemTester:
    def __init__(self, base_url="https://delivery-manager-51.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {
            'cash': [],
            'deliveries': [],
            'deliverers': [],
            'employee_payments': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, check_response=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}" if endpoint else self.base_url
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                # Additional response checks
                if check_response and response.content:
                    try:
                        response_data = response.json()
                        if not check_response(response_data):
                            print(f"⚠️  Response validation failed")
                            success = False
                    except:
                        pass
                        
                return success, response.json() if response.content else {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.content:
                    try:
                        error_data = response.json()
                        print(f"   Error: {error_data}")
                    except:
                        print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        success, response = self.run_test(
            "API Health Check",
            "GET",
            "",
            200,
            check_response=lambda r: "message" in r
        )
        return success

    def test_cash_operations(self):
        """Test cash entry operations"""
        print("\n📊 Testing Cash Operations...")
        
        # Test GET empty cash entries
        success, _ = self.run_test(
            "Get Cash Entries (Empty)",
            "GET",
            "cash",
            200,
            check_response=lambda r: isinstance(r, list)
        )
        
        # Test POST cash entry (entrada)
        cash_data = {
            "entry_type": "entrada",
            "value": 100.50,
            "desc": "Test entrada"
        }
        success, response = self.run_test(
            "Create Cash Entry (Entrada)",
            "POST",
            "cash",
            200,
            data=cash_data,
            check_response=lambda r: r.get("entry_type") == "entrada" and r.get("value") == 100.50
        )
        if success and "id" in response:
            self.created_ids['cash'].append(response["id"])
        
        # Test POST cash entry (saida)
        cash_data = {
            "entry_type": "saida",
            "value": 25.75,
            "desc": "Test saida"
        }
        success, response = self.run_test(
            "Create Cash Entry (Saída)",
            "POST",
            "cash",
            200,
            data=cash_data,
            check_response=lambda r: r.get("entry_type") == "saida" and r.get("value") == 25.75
        )
        if success and "id" in response:
            self.created_ids['cash'].append(response["id"])
        
        # Test GET cash entries with data
        success, response = self.run_test(
            "Get Cash Entries (With Data)",
            "GET",
            "cash",
            200,
            check_response=lambda r: isinstance(r, list) and len(r) >= 2
        )
        
        return success

    def test_deliverer_operations(self):
        """Test deliverer operations"""
        print("\n👥 Testing Deliverer Operations...")
        
        # Test GET empty deliverers
        success, _ = self.run_test(
            "Get Deliverers (Empty)",
            "GET",
            "deliverers",
            200,
            check_response=lambda r: isinstance(r, list)
        )
        
        # Test POST deliverer
        deliverer_data = {"name": "João Silva"}
        success, response = self.run_test(
            "Create Deliverer",
            "POST",
            "deliverers",
            200,
            data=deliverer_data,
            check_response=lambda r: r.get("name") == "João Silva"
        )
        if success and "id" in response:
            self.created_ids['deliverers'].append(response["id"])
        
        # Create another deliverer for testing
        deliverer_data = {"name": "Maria Santos"}
        success, response = self.run_test(
            "Create Second Deliverer",
            "POST",
            "deliverers",
            200,
            data=deliverer_data
        )
        if success and "id" in response:
            self.created_ids['deliverers'].append(response["id"])
        
        # Test GET deliverers with data
        success, response = self.run_test(
            "Get Deliverers (With Data)",
            "GET",
            "deliverers",
            200,
            check_response=lambda r: isinstance(r, list) and len(r) >= 2
        )
        
        return success

    def test_delivery_operations(self):
        """Test delivery operations"""
        print("\n📦 Testing Delivery Operations...")
        
        # Test GET empty deliveries
        success, _ = self.run_test(
            "Get Deliveries (Empty)",
            "GET",
            "deliveries",
            200,
            check_response=lambda r: isinstance(r, list)
        )
        
        # Test POST delivery (PIX)
        delivery_data = {
            "clientName": "Cliente A",
            "amount": 25.50,
            "paymentMethod": "pix",
            "observation": "Test delivery PIX"
        }
        success, response = self.run_test(
            "Create Delivery (PIX)",
            "POST",
            "deliveries",
            200,
            data=delivery_data,
            check_response=lambda r: r.get("seq") == 1 and r.get("paymentMethod") == "pix"
        )
        if success and "id" in response:
            self.created_ids['deliveries'].append(response["id"])
            delivery_id = response["id"]
        
        # Test POST delivery (Cash with change)
        delivery_data = {
            "clientName": "Cliente B",
            "amount": 30.00,
            "paymentMethod": "dinheiro",
            "valorRecebido": 50.00,
            "observation": "Test delivery cash"
        }
        success, response = self.run_test(
            "Create Delivery (Cash with Change)",
            "POST",
            "deliveries",
            200,
            data=delivery_data,
            check_response=lambda r: r.get("seq") == 2 and r.get("troco") == 20.00
        )
        if success and "id" in response:
            self.created_ids['deliveries'].append(response["id"])
        
        # Test PATCH delivery (mark as out for delivery)
        if self.created_ids['deliverers'] and self.created_ids['deliveries']:
            update_data = {
                "saiuParaEntrega": True,
                "delivererId": self.created_ids['deliverers'][0]
            }
            success, response = self.run_test(
                "Update Delivery (Mark as Out)",
                "PATCH",
                f"deliveries/{self.created_ids['deliveries'][0]}",
                200,
                data=update_data,
                check_response=lambda r: r.get("saiuParaEntrega") == True
            )
        
        # Test PATCH delivery (mark as delivered)
        if self.created_ids['deliveries']:
            update_data = {"foiEntregue": True}
            success, response = self.run_test(
                "Update Delivery (Mark as Delivered)",
                "PATCH",
                f"deliveries/{self.created_ids['deliveries'][0]}",
                200,
                data=update_data,
                check_response=lambda r: r.get("foiEntregue") == True
            )
        
        # Test GET deliveries with data
        success, response = self.run_test(
            "Get Deliveries (With Data)",
            "GET",
            "deliveries",
            200,
            check_response=lambda r: isinstance(r, list) and len(r) >= 2
        )
        
        return success

    def test_employee_payment_operations(self):
        """Test employee payment operations"""
        print("\n💰 Testing Employee Payment Operations...")
        
        # Test GET empty employee payments
        success, _ = self.run_test(
            "Get Employee Payments (Empty)",
            "GET",
            "employee-payments",
            200,
            check_response=lambda r: isinstance(r, list)
        )
        
        # Test POST employee payment
        payment_data = {
            "employeeName": "Funcionário A",
            "amount": 500.00,
            "paymentMethod": "pix"
        }
        success, response = self.run_test(
            "Create Employee Payment",
            "POST",
            "employee-payments",
            200,
            data=payment_data,
            check_response=lambda r: r.get("employeeName") == "Funcionário A"
        )
        if success and "id" in response:
            self.created_ids['employee_payments'].append(response["id"])
        
        return success

    def test_clients_pool(self):
        """Test clients pool endpoint"""
        print("\n👤 Testing Clients Pool...")
        
        success, response = self.run_test(
            "Get Clients Pool",
            "GET",
            "clients/pool",
            200,
            check_response=lambda r: "items" in r and isinstance(r["items"], list)
        )
        
        return success

    def test_export_endpoints(self):
        """Test export endpoints"""
        print("\n📄 Testing Export Endpoints...")
        
        # Test Excel export
        success, _ = self.run_test(
            "Export Excel",
            "GET",
            "export/excel",
            200
        )
        
        # Test PDF exports
        success, _ = self.run_test(
            "Export Summary PDF",
            "GET",
            "export/summary-pdf",
            200
        )
        
        success, _ = self.run_test(
            "Export Reports PDF",
            "GET",
            "export/reports-pdf",
            200
        )
        
        success, _ = self.run_test(
            "Export Employees PDF",
            "GET",
            "export/employees-pdf",
            200
        )
        
        return success

    def test_delete_operations(self):
        """Test delete operations"""
        print("\n🗑️  Testing Delete Operations...")
        
        # Delete cash entries
        for cash_id in self.created_ids['cash']:
            success, _ = self.run_test(
                f"Delete Cash Entry",
                "DELETE",
                f"cash/{cash_id}",
                200
            )
        
        # Delete deliveries
        for delivery_id in self.created_ids['deliveries']:
            success, _ = self.run_test(
                f"Delete Delivery",
                "DELETE",
                f"deliveries/{delivery_id}",
                200
            )
        
        # Delete employee payments
        for payment_id in self.created_ids['employee_payments']:
            success, _ = self.run_test(
                f"Delete Employee Payment",
                "DELETE",
                f"employee-payments/{payment_id}",
                200
            )
        
        # Delete deliverers
        for deliverer_id in self.created_ids['deliverers']:
            success, _ = self.run_test(
                f"Delete Deliverer",
                "DELETE",
                f"deliverers/{deliverer_id}",
                200
            )
        
        return success

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Cupim na telha Backend API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Run tests in order
        tests = [
            self.test_health_check,
            self.test_cash_operations,
            self.test_deliverer_operations,
            self.test_delivery_operations,
            self.test_employee_payment_operations,
            self.test_clients_pool,
            self.test_export_endpoints,
            self.test_delete_operations
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                print(f"❌ Test failed with exception: {str(e)}")
        
        # Print final results
        print(f"\n📊 Final Results:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = DeliverySystemTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())