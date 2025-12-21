import { useState, useEffect } from "react";
import "@/App.css";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Download, DollarSign, Package, Users, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, Trash2, Plus, Edit, BarChart3, CreditCard, Wallet, Smartphone } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [cashEntries, setCashEntries] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [deliverers, setDeliverers] = useState([]);
  const [clientsPool, setClientsPool] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [cashForm, setCashForm] = useState({ type: "entrada", value: "", desc: "" });
  const [deliveryForm, setDeliveryForm] = useState({
    clientName: "",
    amount: "",
    paymentMethod: "pix",
    paymentMethod2: "",
    amount2: "",
    valorRecebido: "",
    observation: ""
  });
  const [delivererForm, setDelivererForm] = useState({ name: "" });
  const [employeePayments, setEmployeePayments] = useState([]);
  const [employeeForm, setEmployeeForm] = useState({ employeeName: "", amount: "", paymentMethod: "pix" });

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [delivererFilter, setDelivererFilter] = useState("all");

  // Edit modal state
  const [editingDelivery, setEditingDelivery] = useState(null);
  const [editForm, setEditForm] = useState({ clientName: "", amount: "", paymentMethod: "", paymentMethod2: "", amount2: "", valorRecebido: "", observation: "" });
  
  // Deliverer selection modal state
  const [selectingDelivererFor, setSelectingDelivererFor] = useState(null);
  const [selectedDelivererId, setSelectedDelivererId] = useState("");
  
  // Reports detail modal state
  const [reportDetailMethod, setReportDetailMethod] = useState(null);

  // Load data
  const loadData = async () => {
    try {
      const [cashRes, deliveriesRes, deliverersRes, poolRes, employeeRes] = await Promise.all([
        axios.get(`${API}/cash`),
        axios.get(`${API}/deliveries`),
        axios.get(`${API}/deliverers`),
        axios.get(`${API}/clients/pool`),
        axios.get(`${API}/employee-payments`)
      ]);
      setCashEntries(cashRes.data);
      setDeliveries(deliveriesRes.data);
      setDeliverers(deliverersRes.data);
      setClientsPool(poolRes.data.items || []);
      setEmployeePayments(employeeRes.data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculate statistics
  const stats = {
    totalCash: cashEntries.reduce((acc, entry) => 
      acc + (entry.type === "entrada" ? entry.value : -entry.value), 0
    ),
    totalDeliveries: deliveries.length,
    pendingDeliveries: deliveries.filter(d => !d.foiEntregue && !d.cancelado).length,
    completedToday: deliveries.filter(d => {
      const today = new Date().toDateString();
      const deliveryDate = new Date(d.datetime).toDateString();
      return d.foiEntregue && deliveryDate === today;
    }).length,
    totalRevenue: deliveries
      .filter(d => d.foiEntregue && !d.cancelado)
      .reduce((acc, d) => acc + d.amount, 0)
  };

  // Calculate reports by payment method
  const reports = {
    pix: {
      total: deliveries.filter(d => d.paymentMethod === "pix" && !d.cancelado).reduce((acc, d) => acc + d.amount, 0),
      count: deliveries.filter(d => d.paymentMethod === "pix" && !d.cancelado).length
    },
    cartao: {
      total: deliveries.filter(d => d.paymentMethod === "cartao" && !d.cancelado).reduce((acc, d) => acc + d.amount, 0),
      count: deliveries.filter(d => d.paymentMethod === "cartao" && !d.cancelado).length
    },
    dinheiro: {
      total: deliveries.filter(d => d.paymentMethod === "dinheiro" && !d.cancelado).reduce((acc, d) => acc + d.amount, 0),
      count: deliveries.filter(d => d.paymentMethod === "dinheiro" && !d.cancelado).length
    },
    pago: {
      total: deliveries.filter(d => d.paymentMethod === "pago" && !d.cancelado).reduce((acc, d) => acc + d.amount, 0),
      count: deliveries.filter(d => d.paymentMethod === "pago" && !d.cancelado).length
    },
    vem_retirar: {
      total: deliveries.filter(d => d.paymentMethod === "vem_retirar" && !d.cancelado).reduce((acc, d) => acc + d.amount, 0),
      count: deliveries.filter(d => d.paymentMethod === "vem_retirar" && !d.cancelado).length
    },
    marcar: {
      total: deliveries.filter(d => d.paymentMethod === "marcar" && !d.cancelado).reduce((acc, d) => acc + d.amount, 0),
      count: deliveries.filter(d => d.paymentMethod === "marcar" && !d.cancelado).length
    },
    pagou_conta: {
      total: deliveries.filter(d => d.paymentMethod === "pagou_conta" && !d.cancelado).reduce((acc, d) => acc + d.amount, 0),
      count: deliveries.filter(d => d.paymentMethod === "pagou_conta" && !d.cancelado).length
    }
  };

  // Cash handlers
  const handleAddCash = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/cash`, {
        type: cashForm.type,
        value: parseFloat(cashForm.value),
        desc: cashForm.desc
      });
      toast.success(cashForm.type === "entrada" ? "Entrada registrada!" : "Saída registrada!");
      setCashForm({ type: "entrada", value: "", desc: "" });
      loadData();
    } catch (error) {
      toast.error("Erro ao adicionar entrada");
    }
  };

  const handleDeleteCash = async (id) => {
    try {
      await axios.delete(`${API}/cash/${id}`);
      toast.success("Entrada removida");
      loadData();
    } catch (error) {
      toast.error("Erro ao remover entrada");
    }
  };

  // Delivery handlers
  const handleAddDelivery = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        clientName: deliveryForm.clientName || "(sem nome)",
        amount: parseFloat(deliveryForm.amount),
        paymentMethod: deliveryForm.paymentMethod,
        paymentMethod2: deliveryForm.paymentMethod2 || null,
        amount2: deliveryForm.amount2 ? parseFloat(deliveryForm.amount2) : null,
        valorRecebido: deliveryForm.paymentMethod === "dinheiro" && deliveryForm.valorRecebido 
          ? parseFloat(deliveryForm.valorRecebido) 
          : null,
        observation: deliveryForm.observation || null
      };
      await axios.post(`${API}/deliveries`, payload);
      toast.success("Entrega criada!");
      setDeliveryForm({ clientName: "", amount: "", paymentMethod: "pix", paymentMethod2: "", amount2: "", valorRecebido: "", observation: "" });
      loadData();
    } catch (error) {
      toast.error("Erro ao criar entrega");
    }
  };

  const handleUpdateDelivery = async (id, updates) => {
    try {
      await axios.patch(`${API}/deliveries/${id}`, updates);
      toast.success("Status atualizado");
      loadData();
    } catch (error) {
      toast.error("Erro ao atualizar");
    }
  };

  // Open deliverer selection modal when clicking "Saiu"
  const handleMarkAsOut = (delivery) => {
    setSelectingDelivererFor(delivery);
    setSelectedDelivererId(delivery.delivererId || "");
  };

  // Confirm deliverer selection and mark as out
  const handleConfirmDelivererSelection = async () => {
    if (!selectedDelivererId) {
      toast.error("Por favor, selecione um entregador");
      return;
    }
    
    try {
      await axios.patch(`${API}/deliveries/${selectingDelivererFor.id}`, {
        saiuParaEntrega: true,
        delivererId: selectedDelivererId
      });
      toast.success("Entrega saiu para entrega!");
      setSelectingDelivererFor(null);
      setSelectedDelivererId("");
      loadData();
    } catch (error) {
      toast.error("Erro ao atualizar");
    }
  };

  // Change deliverer for delivery already out
  const handleChangeDeliverer = (delivery) => {
    setSelectingDelivererFor(delivery);
    setSelectedDelivererId(delivery.delivererId || "");
  };

  // Edit delivery handlers
  const openEditModal = (delivery) => {
    setEditingDelivery(delivery);
    setEditForm({
      clientName: delivery.clientName,
      amount: delivery.amount.toString(),
      paymentMethod: delivery.paymentMethod,
      paymentMethod2: delivery.paymentMethod2 || "",
      amount2: delivery.amount2 ? delivery.amount2.toString() : "",
      valorRecebido: delivery.valorRecebido ? delivery.valorRecebido.toString() : "",
      observation: delivery.observation || ""
    });
  };

  const handleEditDelivery = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        clientName: editForm.clientName,
        amount: parseFloat(editForm.amount),
        paymentMethod: editForm.paymentMethod,
        valorRecebido: editForm.paymentMethod === "dinheiro" && editForm.valorRecebido 
          ? parseFloat(editForm.valorRecebido) 
          : null,
        observation: editForm.observation || null
      };
      
      // Calculate troco if cash
      if (payload.paymentMethod === "dinheiro" && payload.valorRecebido) {
        payload.troco = payload.valorRecebido - payload.amount;
      }
      
      await axios.patch(`${API}/deliveries/${editingDelivery.id}`, payload);
      toast.success("Entrega atualizada!");
      setEditingDelivery(null);
      loadData();
    } catch (error) {
      toast.error("Erro ao atualizar entrega");
    }
  };

  const handleDeleteDelivery = async (id) => {
    try {
      await axios.delete(`${API}/deliveries/${id}`);
      toast.success("Entrega removida");
      loadData();
    } catch (error) {
      toast.error("Erro ao remover entrega");
    }
  };

  // Toggle marcado status based on payment method
  const handleToggleMarcado = async (deliveryId, paymentMethod, currentStatus) => {
    try {
      const fieldMap = {
        'pix': 'marcadoPix',
        'cartao': 'marcadoCartao',
        'dinheiro': 'marcadoDinheiro',
        'pago': 'marcadoPago',
        'vem_retirar': 'marcadoVemRetirar',
        'marcar': 'marcadoMarcar',
        'pagou_conta': 'marcadoPagouConta'
      };
      
      const field = fieldMap[paymentMethod];
      if (!field) return;
      
      await axios.patch(`${API}/deliveries/${deliveryId}`, {
        [field]: !currentStatus
      });
      
      loadData();
    } catch (error) {
      toast.error("Erro ao marcar entrega");
    }
  };

  // Deliverer handlers
  const handleAddDeliverer = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/deliverers`, { name: delivererForm.name });
      toast.success("Entregador adicionado!");
      setDelivererForm({ name: "" });
      loadData();
    } catch (error) {
      toast.error("Erro ao adicionar entregador");
    }
  };

  const handleDeleteDeliverer = async (id) => {
    try {
      await axios.delete(`${API}/deliverers/${id}`);
      toast.success("Entregador removido");
      loadData();
    } catch (error) {
      toast.error("Erro ao remover entregador");
    }
  };

  // Export handlers
  const handleExport = () => {
    window.open(`${API}/export/excel`, "_blank");
    toast.success("Exportando para Excel...");
  };

  const handleExportSummaryPDF = () => {
    window.open(`${API}/export/summary-pdf`, "_blank");
    toast.success("Exportando Resumo em PDF...");
  };

  const handleExportReportsPDF = () => {
    window.open(`${API}/export/reports-pdf`, "_blank");
    toast.success("Exportando Relatórios em PDF...");
  };

  const handleExportEmployeesPDF = () => {
    window.open(`${API}/export/employees-pdf`, "_blank");
    toast.success("Exportando Funcionários em PDF...");
  };

  // Employee payment handlers
  const handleAddEmployeePayment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/employee-payments`, {
        employeeName: employeeForm.employeeName,
        amount: parseFloat(employeeForm.amount),
        paymentMethod: employeeForm.paymentMethod
      });
      toast.success("Pagamento registrado!");
      setEmployeeForm({ employeeName: "", amount: "", paymentMethod: "pix" });
      loadData();
    } catch (error) {
      toast.error("Erro ao registrar pagamento");
    }
  };

  const handleDeleteEmployeePayment = async (id) => {
    try {
      await axios.delete(`${API}/employee-payments/${id}`);
      toast.success("Pagamento removido");
      loadData();
    } catch (error) {
      toast.error("Erro ao remover pagamento");
    }
  };

  // Clear all data
  const handleClearAll = async () => {
    if (window.confirm("⚠️ ATENÇÃO! Isso vai apagar TODOS os dados (entregas, caixa, entregadores). Deseja continuar?")) {
      try {
        await axios.delete(`${API}/data/clear`);
        toast.success("Todos os dados foram apagados!");
        loadData();
      } catch (error) {
        toast.error("Erro ao limpar dados");
      }
    }
  };

  // IMPROVED: Filter deliveries with multi-number search support
  const filteredDeliveries = deliveries.filter(d => {
    // Multi-number search: Check if searchTerm contains semicolons
    if (searchTerm.includes(';')) {
      const numbers = searchTerm.split(';').map(n => n.trim()).filter(n => n);
      const matchesMultipleNumbers = numbers.some(num => d.seq.toString() === num);
      
      if (matchesMultipleNumbers) {
        const matchesStatus = statusFilter === "all" ? true :
                             statusFilter === "pending" ? (!d.foiEntregue && !d.cancelado) :
                             statusFilter === "completed" ? d.foiEntregue :
                             statusFilter === "cancelled" ? d.cancelado : true;
        const matchesDeliverer = delivererFilter === "all" ? true : d.delivererId === delivererFilter;
        return matchesStatus && matchesDeliverer;
      }
      return false;
    }
    
    // Regular search: name or single number
    const matchesSearch = d.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         d.seq.toString().includes(searchTerm);
    const matchesStatus = statusFilter === "all" ? true :
                         statusFilter === "pending" ? (!d.foiEntregue && !d.cancelado) :
                         statusFilter === "completed" ? d.foiEntregue :
                         statusFilter === "cancelled" ? d.cancelado : true;
    const matchesDeliverer = delivererFilter === "all" ? true : d.delivererId === delivererFilter;
    return matchesSearch && matchesStatus && matchesDeliverer;
  });

  // Separate active and completed deliveries
  const activeDeliveries = filteredDeliveries.filter(d => !d.foiEntregue);
  const completedDeliveries = filteredDeliveries.filter(d => d.foiEntregue);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 shadow-2xl border-b border-blue-400">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">Cupim na telha</h1>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleClearAll} variant="destructive" className="bg-red-600 hover:bg-red-700 shadow-lg" data-testid="clear-all-btn">
                <XCircle className="mr-2 h-4 w-4" />
                Limpar Tudo
              </Button>
              <Button onClick={handleExport} className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg" data-testid="export-excel-btn">
                <Download className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-xl hover:shadow-2xl transition-all border-0" data-testid="stat-total-cash">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Saldo Caixa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold drop-shadow-md">R$ {stats.totalCash.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-xl hover:shadow-2xl transition-all border-0" data-testid="stat-total-deliveries">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Total Entregas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold drop-shadow-md">{stats.totalDeliveries}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-xl hover:shadow-2xl transition-all border-0" data-testid="stat-pending-deliveries">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold drop-shadow-md">{stats.pendingDeliveries}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-400 to-indigo-600 text-white shadow-xl hover:shadow-2xl transition-all border-0" data-testid="stat-completed-today">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Concluídas Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold drop-shadow-md">{stats.completedToday}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-400 to-cyan-600 text-white shadow-xl hover:shadow-2xl transition-all border-0" data-testid="stat-total-revenue">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Receita Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold drop-shadow-md">R$ {stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="cash" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto bg-gradient-to-r from-blue-700 to-blue-600 shadow-lg">
            <TabsTrigger value="cash" data-testid="tab-cash" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">Caixa</TabsTrigger>
            <TabsTrigger value="deliveries" data-testid="tab-deliveries" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">Entregas</TabsTrigger>
            <TabsTrigger value="summary" data-testid="tab-summary" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">Resumo</TabsTrigger>
            <TabsTrigger value="reports" data-testid="tab-reports" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">Relatórios</TabsTrigger>
            <TabsTrigger value="employees" data-testid="tab-employees" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">Funcionários</TabsTrigger>
            <TabsTrigger value="deliverers" data-testid="tab-deliverers" className="data-[state=active]:bg-white data-[state=active]:text-blue-600">Entregadores</TabsTrigger>
          </TabsList>

          {/* Deliveries Tab */}
          <TabsContent value="deliveries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Nova Entrega</CardTitle>
                <CardDescription>Registre uma nova entrega</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddDelivery} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="clientName">Nome do Cliente</Label>
                      <Input
                        id="clientName"
                        data-testid="delivery-client-name"
                        placeholder="Digite o nome"
                        value={deliveryForm.clientName}
                        onChange={(e) => setDeliveryForm({...deliveryForm, clientName: e.target.value})}
                        list="clients-list"
                      />
                      <datalist id="clients-list">
                        {clientsPool.map(client => (
                          <option key={client} value={client} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <Label htmlFor="amount">Valor (R$)</Label>
                      <Input
                        id="amount"
                        data-testid="delivery-amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={deliveryForm.amount}
                        onChange={(e) => setDeliveryForm({...deliveryForm, amount: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="paymentMethod">Forma de Pagamento 1</Label>
                      <Select
                        value={deliveryForm.paymentMethod}
                        onValueChange={(value) => setDeliveryForm({...deliveryForm, paymentMethod: value})}
                      >
                        <SelectTrigger data-testid="delivery-payment-method">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="cartao">Cartão</SelectItem>
                          <SelectItem value="dinheiro">Dinheiro</SelectItem>
                          <SelectItem value="pago">Pago</SelectItem>
                          <SelectItem value="vem_retirar">Vem Retirar</SelectItem>
                          <SelectItem value="marcar">Marcar</SelectItem>
                          <SelectItem value="pagou_conta">Pagou a Conta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {deliveryForm.paymentMethod === "dinheiro" && (
                      <div>
                        <Label htmlFor="valorRecebido">Valor Recebido (R$)</Label>
                        <Input
                          id="valorRecebido"
                          data-testid="delivery-valor-recebido"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={deliveryForm.valorRecebido}
                          onChange={(e) => setDeliveryForm({...deliveryForm, valorRecebido: e.target.value})}
                        />
                      </div>
                    )}
                    <div>
                      <Label htmlFor="paymentMethod2">Forma de Pagamento 2 (Opcional)</Label>
                      <Select
                        value={deliveryForm.paymentMethod2 || "none"}
                        onValueChange={(value) => setDeliveryForm({...deliveryForm, paymentMethod2: value === "none" ? "" : value})}
                      >
                        <SelectTrigger data-testid="delivery-payment-method2">
                          <SelectValue placeholder="Nenhuma" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="cartao">Cartão</SelectItem>
                          <SelectItem value="dinheiro">Dinheiro</SelectItem>
                          <SelectItem value="marcar">Marcar</SelectItem>
                          <SelectItem value="pagou_conta">Pagou a Conta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {deliveryForm.paymentMethod2 && (
                      <div>
                        <Label htmlFor="amount2">Valor Pagamento 2 (R$)</Label>
                        <Input
                          id="amount2"
                          data-testid="delivery-amount2"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={deliveryForm.amount2}
                          onChange={(e) => setDeliveryForm({...deliveryForm, amount2: e.target.value})}
                        />
                      </div>
                    )}
                    <div className="col-span-full">
                      <Label htmlFor="observation">Observação (Opcional)</Label>
                      <Input
                        id="observation"
                        data-testid="delivery-observation"
                        placeholder="Digite uma observação (opcional)"
                        value={deliveryForm.observation}
                        onChange={(e) => setDeliveryForm({...deliveryForm, observation: e.target.value})}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full md:w-auto" data-testid="add-delivery-btn">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Entrega
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
                <CardDescription>
                  💡 Dica: Para buscar múltiplos números, use ponto e vírgula. Ex: 27;45;67
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="search">Buscar</Label>
                    <Input
                      id="search"
                      data-testid="search-deliveries"
                      placeholder="Nome, número ou múltiplos (27;45)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="statusFilter">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger data-testid="filter-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pending">Pendentes e Em Entrega</SelectItem>
                        <SelectItem value="only_pending">Apenas Pendentes</SelectItem>
                        <SelectItem value="only_out">Apenas Em Entrega</SelectItem>
                        <SelectItem value="completed">Concluídas</SelectItem>
                        <SelectItem value="cancelled">Canceladas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="delivererFilter">Entregador</Label>
                    <Select value={delivererFilter} onValueChange={setDelivererFilter}>
                      <SelectTrigger data-testid="filter-deliverer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Entregadores</SelectItem>
                        {deliverers.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Deliveries List */}
            <Card>
              <CardHeader>
                <CardTitle>Entregas Ativas ({activeDeliveries.length})</CardTitle>
                <CardDescription>Pendentes e em entrega</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="border p-2 text-left">#</th>
                          <th className="border p-2 text-left">Cliente</th>
                          <th className="border p-2 text-left">Valor</th>
                          <th className="border p-2 text-left">Pagamento 1</th>
                          <th className="border p-2 text-left">Pagamento 2</th>
                          <th className="border p-2 text-left">Valor Recebido</th>
                          <th className="border p-2 text-left">Troco</th>
                          <th className="border p-2 text-left">Observação</th>
                          <th className="border p-2 text-left">Cadastro</th>
                          <th className="border p-2 text-left">Saiu</th>
                          <th className="border p-2 text-left">Status</th>
                          <th className="border p-2 text-left">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeDeliveries.map(delivery => {
                          return (
                            <tr key={delivery.id} className="hover:bg-gray-50" data-testid={`delivery-item-${delivery.id}`}>
                              <td className="border p-2">
                                <Badge variant="outline">#{delivery.seq}</Badge>
                              </td>
                              <td className="border p-2 font-semibold">{delivery.clientName}</td>
                              <td className="border p-2">
                                R$ {(delivery.amount + (delivery.amount2 || 0)).toFixed(2)}
                              </td>
                              <td className="border p-2">
                                <Badge variant="secondary">{delivery.paymentMethod.toUpperCase()}</Badge>
                                <div className="text-xs mt-1">R$ {delivery.amount.toFixed(2)}</div>
                              </td>
                              <td className="border p-2">
                                {delivery.paymentMethod2 ? (
                                  <>
                                    <Badge variant="secondary">{delivery.paymentMethod2.toUpperCase()}</Badge>
                                    {delivery.amount2 && <div className="text-xs mt-1">R$ {delivery.amount2.toFixed(2)}</div>}
                                  </>
                                ) : '-'}
                              </td>
                              <td className="border p-2">
                                {delivery.valorRecebido ? `R$ ${delivery.valorRecebido.toFixed(2)}` : '-'}
                              </td>
                              <td className="border p-2">
                                {delivery.troco ? `R$ ${delivery.troco.toFixed(2)}` : '-'}
                              </td>
                              <td className="border p-2 text-xs max-w-[150px] truncate" title={delivery.observation}>
                                {delivery.observation || '-'}
                              </td>
                              <td className="border p-2 text-xs">{new Date(delivery.datetime).toLocaleString('pt-BR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'})}</td>
                              <td className="border p-2 text-xs">{delivery.horaSaida ? new Date(delivery.horaSaida).toLocaleString('pt-BR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'}) : '-'}</td>
                              <td className="border p-2">
                                {delivery.cancelado ? (
                                  <Badge variant="destructive">Cancelado</Badge>
                                ) : delivery.saiuParaEntrega ? (
                                  <Badge className="bg-blue-500">Em Entrega</Badge>
                                ) : (
                                  <Badge className="bg-yellow-500">Pendente</Badge>
                                )}
                              </td>
                              <td className="border p-2">
                                <div className="flex flex-wrap gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2"
                                    onClick={() => openEditModal(delivery)}
                                    data-testid={`edit-delivery-${delivery.id}`}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  {!delivery.foiEntregue && (
                                    <>
                                      {!delivery.cancelado && (
                                        <>
                                          {!delivery.saiuParaEntrega && (
                                            <Button
                                              size="sm"
                                              className="h-7 text-xs px-2"
                                              onClick={() => handleMarkAsOut(delivery)}
                                              data-testid={`mark-out-delivery-${delivery.id}`}
                                            >
                                              Saiu
                                            </Button>
                                          )}
                                          {delivery.saiuParaEntrega && (
                                            <>
                                              <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 h-7 text-xs px-2"
                                                onClick={() => handleUpdateDelivery(delivery.id, { foiEntregue: true })}
                                                data-testid={`mark-delivered-${delivery.id}`}
                                              >
                                                Entregue
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 text-xs px-2"
                                                onClick={() => handleChangeDeliverer(delivery)}
                                                data-testid={`change-deliverer-${delivery.id}`}
                                              >
                                                Alterar
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 text-xs px-2 text-red-600 hover:text-red-700"
                                                onClick={() => handleUpdateDelivery(delivery.id, { saiuParaEntrega: false, delivererId: null, horaSaida: null })}
                                                data-testid={`remove-deliverer-${delivery.id}`}
                                              >
                                                Remover Entregador
                                              </Button>
                                            </>
                                          )}
                                        </>
                                      )}
                                      <Button
                                        size="sm"
                                        variant={delivery.cancelado ? "default" : "destructive"}
                                        className="h-7 text-xs px-2"
                                        onClick={() => handleUpdateDelivery(delivery.id, { cancelado: !delivery.cancelado })}
                                        data-testid={`cancel-delivery-${delivery.id}`}
                                      >
                                        {delivery.cancelado ? 'Descancelar' : 'Cancelar'}
                                      </Button>
                                    </>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2"
                                    onClick={() => handleDeleteDelivery(delivery.id)}
                                    data-testid={`delete-delivery-${delivery.id}`}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {activeDeliveries.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Nenhuma entrega ativa
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Completed Deliveries List */}
            <Card>
              <CardHeader>
                <CardTitle>Entregas Concluídas ({completedDeliveries.length})</CardTitle>
                <CardDescription>Entregas já finalizadas</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="border p-2 text-left">#</th>
                          <th className="border p-2 text-left">Cliente</th>
                          <th className="border p-2 text-left">Valor</th>
                          <th className="border p-2 text-left">Pagamento 1</th>
                          <th className="border p-2 text-left">Pagamento 2</th>
                          <th className="border p-2 text-left">Valor Recebido</th>
                          <th className="border p-2 text-left">Troco</th>
                          <th className="border p-2 text-left">Observação</th>
                          <th className="border p-2 text-left">Entregador</th>
                          <th className="border p-2 text-left">Cadastro</th>
                          <th className="border p-2 text-left">Saiu</th>
                          <th className="border p-2 text-left">Entregue</th>
                          <th className="border p-2 text-left">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {completedDeliveries.map(delivery => {
                          const deliverer = deliverers.find(d => d.id === delivery.delivererId);
                          
                          return (
                            <tr key={delivery.id} className="hover:bg-gray-50" data-testid={`completed-delivery-${delivery.id}`}>
                              <td className="border p-2">
                                <Badge variant="outline">#{delivery.seq}</Badge>
                              </td>
                              <td className="border p-2 font-semibold">{delivery.clientName}</td>
                              <td className="border p-2">
                                R$ {(delivery.amount + (delivery.amount2 || 0)).toFixed(2)}
                              </td>
                              <td className="border p-2">
                                <Badge variant="secondary">{delivery.paymentMethod.toUpperCase()}</Badge>
                                <div className="text-xs mt-1">R$ {delivery.amount.toFixed(2)}</div>
                              </td>
                              <td className="border p-2">
                                {delivery.paymentMethod2 ? (
                                  <>
                                    <Badge variant="secondary">{delivery.paymentMethod2.toUpperCase()}</Badge>
                                    {delivery.amount2 && <div className="text-xs mt-1">R$ {delivery.amount2.toFixed(2)}</div>}
                                  </>
                                ) : '-'}
                              </td>
                              <td className="border p-2">
                                {delivery.valorRecebido ? `R$ ${delivery.valorRecebido.toFixed(2)}` : '-'}
                              </td>
                              <td className="border p-2">
                                {delivery.troco ? `R$ ${delivery.troco.toFixed(2)}` : '-'}
                              </td>
                              <td className="border p-2 text-xs max-w-[150px] truncate" title={delivery.observation}>
                                {delivery.observation || '-'}
                              </td>
                              <td className="border p-2">{deliverer ? deliverer.name : '-'}</td>
                              <td className="border p-2 text-xs">{new Date(delivery.datetime).toLocaleString('pt-BR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'})}</td>
                              <td className="border p-2 text-xs">{delivery.horaSaida ? new Date(delivery.horaSaida).toLocaleString('pt-BR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'}) : '-'}</td>
                              <td className="border p-2 text-xs">{delivery.horaEntregue ? new Date(delivery.horaEntregue).toLocaleString('pt-BR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'}) : '-'}</td>
                              <td className="border p-2">
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs px-2"
                                    onClick={() => handleUpdateDelivery(delivery.id, { foiEntregue: false, horaEntregue: null })}
                                    data-testid={`unmark-delivered-${delivery.id}`}
                                  >
                                    Voltar p/ Ativas
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2"
                                    onClick={() => handleDeleteDelivery(delivery.id)}
                                    data-testid={`delete-completed-delivery-${delivery.id}`}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {completedDeliveries.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Nenhuma entrega concluída
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Resumo Completo de Entregas</CardTitle>
                    <CardDescription>Visão detalhada de todas as entregas</CardDescription>
                  </div>
                  <Button onClick={handleExportSummaryPDF} className="bg-red-600 hover:bg-red-700 text-white" data-testid="export-summary-pdf-btn">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[700px]">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="border p-2 text-left">#</th>
                          <th className="border p-2 text-left">Cliente</th>
                          <th className="border p-2 text-left">Valor</th>
                          <th className="border p-2 text-left">Pagamento</th>
                          <th className="border p-2 text-left">Valor a Receber</th>
                          <th className="border p-2 text-left">Entregador</th>
                          <th className="border p-2 text-left">Status</th>
                          <th className="border p-2 text-left">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deliveries.map(delivery => {
                          const deliverer = deliverers.find(d => d.id === delivery.delivererId);
                          const valorAReceber = delivery.paymentMethod === "dinheiro" && delivery.valorRecebido 
                            ? `R$ ${delivery.valorRecebido.toFixed(2)} (Troco: R$ ${delivery.troco?.toFixed(2)})`
                            : delivery.paymentMethod === "pago" ? "Pago" 
                            : delivery.paymentMethod === "vem_retirar" ? "Pagar ao Retirar"
                            : `R$ ${delivery.amount.toFixed(2)}`;
                          
                          return (
                            <tr key={delivery.id} className="hover:bg-gray-50" data-testid={`summary-row-${delivery.id}`}>
                              <td className="border p-2">
                                <Badge variant="outline">#{delivery.seq}</Badge>
                              </td>
                              <td className="border p-2 font-semibold">{delivery.clientName}</td>
                              <td className="border p-2">
                                R$ {(delivery.amount + (delivery.amount2 || 0)).toFixed(2)}
                              </td>
                              <td className="border p-2">
                                <Badge variant="secondary">{delivery.paymentMethod.toUpperCase()}</Badge>
                                {delivery.paymentMethod2 && (
                                  <>
                                    {' + '}
                                    <Badge variant="secondary">{delivery.paymentMethod2.toUpperCase()}</Badge>
                                  </>
                                )}
                              </td>
                              <td className="border p-2">{valorAReceber}</td>
                              <td className="border p-2">{deliverer ? deliverer.name : "-"}</td>
                              <td className="border p-2">
                                {delivery.cancelado ? (
                                  <Badge variant="destructive">Cancelado</Badge>
                                ) : delivery.foiEntregue ? (
                                  <Badge className="bg-green-500">Entregue</Badge>
                                ) : delivery.saiuParaEntrega ? (
                                  <Badge className="bg-blue-500">Em Entrega</Badge>
                                ) : (
                                  <Badge className="bg-yellow-500">Pendente</Badge>
                                )}
                              </td>
                              <td className="border p-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2"
                                  onClick={() => openEditModal(delivery)}
                                  data-testid={`edit-summary-delivery-${delivery.id}`}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {deliveries.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Nenhuma entrega registrada
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card className="bg-white shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                      Relatórios por Forma de Pagamento
                    </CardTitle>
                    <CardDescription>Análise detalhada de valores por método de pagamento</CardDescription>
                  </div>
                  <Button onClick={handleExportReportsPDF} className="bg-red-600 hover:bg-red-700 text-white" data-testid="export-reports-pdf-btn">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                  {/* PIX */}
                  <Card 
                    className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                    onClick={() => setReportDetailMethod('pix')}
                    data-testid="report-card-pix"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-blue-700">
                        <Smartphone className="h-6 w-6" />
                        PIX
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-blue-900 mb-2">
                        R$ {reports.pix.total.toFixed(2)}
                      </div>
                      <div className="text-sm text-blue-700">
                        {reports.pix.count} {reports.pix.count === 1 ? 'entrega' : 'entregas'}
                      </div>
                      <div className="text-xs text-blue-600 mt-2 font-semibold">
                        Clique para ver detalhes →
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cartão */}
                  <Card 
                    className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-300 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                    onClick={() => setReportDetailMethod('cartao')}
                    data-testid="report-card-cartao"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-indigo-700">
                        <CreditCard className="h-6 w-6" />
                        Cartão
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-indigo-900 mb-2">
                        R$ {reports.cartao.total.toFixed(2)}
                      </div>
                      <div className="text-sm text-indigo-700">
                        {reports.cartao.count} {reports.cartao.count === 1 ? 'entrega' : 'entregas'}
                      </div>
                      <div className="text-xs text-indigo-600 mt-2 font-semibold">
                        Clique para ver detalhes →
                      </div>
                    </CardContent>
                  </Card>

                  {/* Dinheiro */}
                  <Card 
                    className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                    onClick={() => setReportDetailMethod('dinheiro')}
                    data-testid="report-card-dinheiro"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-green-700">
                        <Wallet className="h-6 w-6" />
                        Dinheiro
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-green-900 mb-2">
                        R$ {reports.dinheiro.total.toFixed(2)}
                      </div>
                      <div className="text-sm text-green-700">
                        {reports.dinheiro.count} {reports.dinheiro.count === 1 ? 'entrega' : 'entregas'}
                      </div>
                      <div className="text-xs text-green-600 mt-2 font-semibold">
                        Clique para ver detalhes →
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pago */}
                  <Card 
                    className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                    onClick={() => setReportDetailMethod('pago')}
                    data-testid="report-card-pago"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-amber-700">
                        <CheckCircle className="h-6 w-6" />
                        Pago
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-amber-900 mb-2">
                        R$ {reports.pago.total.toFixed(2)}
                      </div>
                      <div className="text-sm text-amber-700">
                        {reports.pago.count} {reports.pago.count === 1 ? 'entrega' : 'entregas'}
                      </div>
                      <div className="text-xs text-amber-600 mt-2 font-semibold">
                        Clique para ver detalhes →
                      </div>
                    </CardContent>
                  </Card>

                  {/* Vem Retirar */}
                  <Card 
                    className="bg-gradient-to-br from-rose-50 to-rose-100 border-2 border-rose-300 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                    onClick={() => setReportDetailMethod('vem_retirar')}
                    data-testid="report-card-vem-retirar"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-rose-700">
                        <Package className="h-6 w-6" />
                        Vem Retirar
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-rose-900 mb-2">
                        R$ {reports.vem_retirar.total.toFixed(2)}
                      </div>
                      <div className="text-sm text-rose-700">
                        {reports.vem_retirar.count} {reports.vem_retirar.count === 1 ? 'entrega' : 'entregas'}
                      </div>
                      <div className="text-xs text-rose-600 mt-2 font-semibold">
                        Clique para ver detalhes →
                      </div>
                    </CardContent>
                  </Card>

                  {/* Marcar */}
                  <Card 
                    className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                    onClick={() => setReportDetailMethod('marcar')}
                    data-testid="report-card-marcar"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-purple-700">
                        <CheckCircle className="h-6 w-6" />
                        Marcar
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-purple-900 mb-2">
                        R$ {reports.marcar.total.toFixed(2)}
                      </div>
                      <div className="text-sm text-purple-700">
                        {reports.marcar.count} {reports.marcar.count === 1 ? 'entrega' : 'entregas'}
                      </div>
                      <div className="text-xs text-purple-600 mt-2 font-semibold">
                        Clique para ver detalhes →
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pagou a Conta */}
                  <Card 
                    className="bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-300 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                    onClick={() => setReportDetailMethod('pagou_conta')}
                    data-testid="report-card-pagou-conta"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-teal-700">
                        <CheckCircle className="h-6 w-6" />
                        Pagou a Conta
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-teal-900 mb-2">
                        R$ {reports.pagou_conta.total.toFixed(2)}
                      </div>
                      <div className="text-sm text-teal-700">
                        {reports.pagou_conta.count} {reports.pagou_conta.count === 1 ? 'entrega' : 'entregas'}
                      </div>
                      <div className="text-xs text-teal-600 mt-2 font-semibold">
                        Clique para ver detalhes →
                      </div>
                    </CardContent>
                  </Card>

                  {/* Total Geral */}
                  <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-white">
                        <TrendingUp className="h-6 w-6" />
                        Total Geral
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold mb-2">
                        R$ {(reports.pix.total + reports.cartao.total + reports.dinheiro.total + reports.pago.total + reports.vem_retirar.total + reports.marcar.total + reports.pagou_conta.total).toFixed(2)}
                      </div>
                      <div className="text-sm text-blue-100">
                        {reports.pix.count + reports.cartao.count + reports.dinheiro.count + reports.pago.count + reports.vem_retirar.count + reports.marcar.count + reports.pagou_conta.count} entregas totais
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cash Tab - Continuing in next part due to length */}
          <TabsContent value="cash" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Nova Entrada/Saída</CardTitle>
                <CardDescription>Registre movimentações no caixa</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCash} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="cashType">Tipo</Label>
                      <Select
                        value={cashForm.type}
                        onValueChange={(value) => setCashForm({...cashForm, type: value})}
                      >
                        <SelectTrigger data-testid="cash-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entrada">Entrada</SelectItem>
                          <SelectItem value="saida">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="cashValue">Valor (R$)</Label>
                      <Input
                        id="cashValue"
                        data-testid="cash-value"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={cashForm.value}
                        onChange={(e) => setCashForm({...cashForm, value: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cashDesc">Descrição</Label>
                      <Input
                        id="cashDesc"
                        data-testid="cash-desc"
                        placeholder="Descrição da movimentação"
                        value={cashForm.desc}
                        onChange={(e) => setCashForm({...cashForm, desc: e.target.value})}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full md:w-auto" data-testid="add-cash-btn">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Cash Balance */}
            <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
              <CardHeader>
                <CardTitle className="text-2xl">Saldo Atual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">R$ {stats.totalCash.toFixed(2)}</div>
              </CardContent>
            </Card>

            {/* Cash Entries List */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Movimentações</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {cashEntries.map(entry => (
                      <Card key={entry.id} data-testid={`cash-entry-${entry.id}`}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {entry.type === "entrada" ? (
                                <TrendingUp className="h-8 w-8 text-green-500" />
                              ) : (
                                <TrendingDown className="h-8 w-8 text-red-500" />
                              )}
                              <div>
                                <div className="font-semibold text-lg">
                                  R$ {entry.value.toFixed(2)}
                                </div>
                                <div className="text-sm text-gray-600">{entry.desc || "Sem descrição"}</div>
                                <div className="text-xs text-gray-500">
                                  {new Date(entry.datetime).toLocaleString('pt-BR')}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={entry.type === "entrada" ? "default" : "destructive"}>
                                {entry.type === "entrada" ? "ENTRADA" : "SAÍDA"}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteCash(entry.id)}
                                data-testid={`delete-cash-${entry.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {cashEntries.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Nenhuma movimentação registrada
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Pagamentos de Funcionários</CardTitle>
                    <CardDescription>Registre pagamentos realizados aos funcionários</CardDescription>
                  </div>
                  <Button onClick={handleExportEmployeesPDF} className="bg-red-600 hover:bg-red-700 text-white" data-testid="export-employees-pdf-btn">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddEmployeePayment} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="employeeName">Nome do Funcionário</Label>
                      <Input
                        id="employeeName"
                        data-testid="employee-name"
                        placeholder="Digite o nome"
                        value={employeeForm.employeeName}
                        onChange={(e) => setEmployeeForm({...employeeForm, employeeName: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="employeeAmount">Valor (R$)</Label>
                      <Input
                        id="employeeAmount"
                        data-testid="employee-amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={employeeForm.amount}
                        onChange={(e) => setEmployeeForm({...employeeForm, amount: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="employeePaymentMethod">Forma de Pagamento</Label>
                      <Select
                        value={employeeForm.paymentMethod}
                        onValueChange={(value) => setEmployeeForm({...employeeForm, paymentMethod: value})}
                      >
                        <SelectTrigger data-testid="employee-payment-method">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full md:w-auto" data-testid="add-employee-payment-btn">
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar Pagamento
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Employee Payments List */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Pagamentos ({employeePayments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {employeePayments.map(payment => (
                      <Card key={payment.id} className="border-l-4 border-blue-500" data-testid={`employee-payment-${payment.id}`}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{payment.employeeName}</h3>
                              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-2">
                                <div>Valor: <span className="font-semibold text-gray-900">R$ {payment.amount.toFixed(2)}</span></div>
                                <div>Pagamento: <span className="font-semibold text-gray-900">{payment.paymentMethod.toUpperCase()}</span></div>
                                <div className="col-span-2">
                                  <span className="text-xs">📅 Data: {new Date(payment.datetime).toLocaleString('pt-BR')}</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteEmployeePayment(payment.id)}
                              data-testid={`delete-employee-payment-${payment.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {employeePayments.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Nenhum pagamento registrado
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardHeader>
                <CardTitle className="text-2xl">Total Pago aos Funcionários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  R$ {employeePayments.reduce((acc, p) => acc + p.amount, 0).toFixed(2)}
                </div>
                <div className="text-sm text-blue-100 mt-2">
                  {employeePayments.length} {employeePayments.length === 1 ? 'pagamento' : 'pagamentos'}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deliverers Tab */}
          <TabsContent value="deliverers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Entregador</CardTitle>
                <CardDescription>Cadastre novos entregadores</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddDeliverer} className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="delivererName">Nome do Entregador</Label>
                      <Input
                        id="delivererName"
                        data-testid="deliverer-name"
                        placeholder="Digite o nome"
                        value={delivererForm.name}
                        onChange={(e) => setDelivererForm({name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" data-testid="add-deliverer-btn">
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Deliverers List */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Entregadores ({deliverers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deliverers.map(deliverer => {
                    const delivererDeliveries = deliveries.filter(d => d.delivererId === deliverer.id);
                    const completed = delivererDeliveries.filter(d => d.foiEntregue).length;
                    return (
                      <Card key={deliverer.id} data-testid={`deliverer-item-${deliverer.id}`}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-500" />
                                {deliverer.name}
                              </h3>
                              <div className="text-sm text-gray-600 mt-2">
                                Total: {delivererDeliveries.length} entregas
                              </div>
                              <div className="text-sm text-gray-600">
                                Concluídas: {completed}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteDeliverer(deliverer.id)}
                              data-testid={`delete-deliverer-${deliverer.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {deliverers.length === 0 && (
                    <div className="col-span-3 text-center py-8 text-gray-500">
                      Nenhum entregador cadastrado
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Report Detail Dialog */}
      <Dialog open={reportDetailMethod !== null} onOpenChange={() => setReportDetailMethod(null)}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              Detalhes - {reportDetailMethod === 'pix' ? 'PIX' : 
                         reportDetailMethod === 'cartao' ? 'Cartão' :
                         reportDetailMethod === 'dinheiro' ? 'Dinheiro' :
                         reportDetailMethod === 'pago' ? 'Pago' :
                         reportDetailMethod === 'vem_retirar' ? 'Vem Retirar' :
                         reportDetailMethod === 'marcar' ? 'Marcar' :
                         reportDetailMethod === 'pagou_conta' ? 'Pagou a Conta' : ''}
            </DialogTitle>
            <DialogDescription>
              Lista completa de entregas com esta forma de pagamento
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="border p-2 text-center w-12">✓</th>
                    <th className="border p-2 text-left">#</th>
                    <th className="border p-2 text-left">Cliente</th>
                    <th className="border p-2 text-left">Valor</th>
                    <th className="border p-2 text-left">Observação</th>
                    <th className="border p-2 text-left">Status</th>
                    <th className="border p-2 text-left">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries
                    .filter(d => d.paymentMethod === reportDetailMethod && !d.cancelado)
                    .sort((a, b) => b.seq - a.seq)
                    .map(delivery => {
                      const getMarcadoStatus = () => {
                        switch(reportDetailMethod) {
                          case 'pix': return delivery.marcadoPix;
                          case 'cartao': return delivery.marcadoCartao;
                          case 'dinheiro': return delivery.marcadoDinheiro;
                          case 'pago': return delivery.marcadoPago;
                          case 'vem_retirar': return delivery.marcadoVemRetirar;
                          case 'marcar': return delivery.marcadoMarcar;
                          case 'pagou_conta': return delivery.marcadoPagouConta;
                          default: return false;
                        }
                      };
                      
                      const isMarcado = getMarcadoStatus();
                      
                      return (
                        <tr 
                          key={delivery.id} 
                          className={`hover:bg-gray-50 transition-colors ${isMarcado ? 'bg-green-100' : ''}`}
                        >
                          <td className="border p-2 text-center">
                            <Checkbox
                              checked={isMarcado}
                              onCheckedChange={() => handleToggleMarcado(delivery.id, reportDetailMethod, isMarcado)}
                              className="mx-auto"
                            />
                          </td>
                          <td className="border p-2">
                            <Badge variant="outline">#{delivery.seq}</Badge>
                          </td>
                          <td className="border p-2 font-semibold">{delivery.clientName}</td>
                          <td className="border p-2">R$ {delivery.amount.toFixed(2)}</td>
                          <td className="border p-2 text-xs max-w-[200px] truncate" title={delivery.observation}>
                            {delivery.observation || '-'}
                          </td>
                          <td className="border p-2">
                            {delivery.foiEntregue ? (
                              <Badge className="bg-green-500">Entregue</Badge>
                            ) : delivery.saiuParaEntrega ? (
                              <Badge className="bg-blue-500">Em Entrega</Badge>
                            ) : (
                              <Badge className="bg-yellow-500">Pendente</Badge>
                            )}
                          </td>
                          <td className="border p-2 text-xs">
                            {new Date(delivery.datetime).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              {deliveries.filter(d => d.paymentMethod === reportDetailMethod && !d.cancelado).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma entrega encontrada com esta forma de pagamento
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-lg font-bold">
              Total: R$ {deliveries
                .filter(d => d.paymentMethod === reportDetailMethod && !d.cancelado)
                .reduce((acc, d) => acc + d.amount, 0)
                .toFixed(2)}
            </div>
            <Button onClick={() => setReportDetailMethod(null)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deliverer Selection Dialog */}
      <Dialog open={selectingDelivererFor !== null} onOpenChange={() => setSelectingDelivererFor(null)}>
        <DialogContent className="sm:max-w-[400px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              Selecionar Entregador
            </DialogTitle>
            <DialogDescription>
              Entrega #{selectingDelivererFor?.seq} - {selectingDelivererFor?.clientName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="select-deliverer">Entregador</Label>
              <Select
                value={selectedDelivererId}
                onValueChange={setSelectedDelivererId}
              >
                <SelectTrigger data-testid="select-deliverer">
                  <SelectValue placeholder="Selecione um entregador" />
                </SelectTrigger>
                <SelectContent>
                  {deliverers.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleConfirmDelivererSelection} 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                data-testid="confirm-deliverer-btn"
              >
                Confirmar
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setSelectingDelivererFor(null)} 
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Delivery Dialog */}
      <Dialog open={editingDelivery !== null} onOpenChange={() => setEditingDelivery(null)}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Edit className="h-6 w-6 text-blue-600" />
              Editar Entrega #{editingDelivery?.seq}
            </DialogTitle>
            <DialogDescription>
              Altere os dados da entrega abaixo
            </DialogDescription>
          </DialogHeader>
          {editingDelivery && (
            <form onSubmit={handleEditDelivery} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-clientName">Nome do Cliente</Label>
                  <Input
                    id="edit-clientName"
                    data-testid="edit-client-name"
                    value={editForm.clientName}
                    onChange={(e) => setEditForm({...editForm, clientName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-amount">Valor (R$)</Label>
                  <Input
                    id="edit-amount"
                    data-testid="edit-amount"
                    type="number"
                    step="0.01"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-paymentMethod">Forma de Pagamento</Label>
                  <Select
                    value={editForm.paymentMethod}
                    onValueChange={(value) => setEditForm({...editForm, paymentMethod: value})}
                  >
                    <SelectTrigger data-testid="edit-payment-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="cartao">Cartão</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="vem_retirar">Vem Retirar</SelectItem>
                      <SelectItem value="marcar">Marcar</SelectItem>
                      <SelectItem value="pagou_conta">Pagou a Conta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editForm.paymentMethod === "dinheiro" && (
                  <div>
                    <Label htmlFor="edit-valorRecebido">Valor Recebido (R$)</Label>
                    <Input
                      id="edit-valorRecebido"
                      data-testid="edit-valor-recebido"
                      type="number"
                      step="0.01"
                      value={editForm.valorRecebido}
                      onChange={(e) => setEditForm({...editForm, valorRecebido: e.target.value})}
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="edit-observation">Observação</Label>
                  <Input
                    id="edit-observation"
                    data-testid="edit-observation"
                    placeholder="Digite uma observação (opcional)"
                    value={editForm.observation}
                    onChange={(e) => setEditForm({...editForm, observation: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" data-testid="save-edit-btn">
                  Salvar Alterações
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingDelivery(null)} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
