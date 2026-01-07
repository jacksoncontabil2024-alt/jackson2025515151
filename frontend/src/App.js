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

  // Filter deliveries
  const filteredDeliveries = deliveries.filter(d => {
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

          {/* Cash Tab */}
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

          {/* Deliveries Tab - I'll continue in next file due to length */}
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
                          <SelectItem value="pago">Já Pago</SelectItem>
                          <SelectItem value="vem_retirar">Vem Retirar</SelectItem>
                          <SelectItem value="marcar">Marcar</SelectItem>
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
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="search">Buscar</Label>
                    <Input
                      id="search"
                      data-testid="search-deliveries"
                      placeholder="Nome do cliente ou número"
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
                        <SelectItem value="pending">Pendentes</SelectItem>
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

            {/* Active Deliveries List - Continuing... */}
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
                              <td className="border p-2">R$ {delivery.amount.toFixed(2)}</td>
                              <td className="border p-2">
                                <Badge variant="secondary">{delivery.paymentMethod.toUpperCase()}</Badge>
                                {delivery.amount2 && <div className="text-xs mt-1">R$ {delivery.amount2.toFixed(2)}</div>}
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
                                  {!delivery.cancelado && !delivery.foiEntregue && (
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
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="h-7 text-xs px-2"
                                        onClick={() => handleUpdateDelivery(delivery.id, { cancelado: true })}
                                        data-testid={`cancel-delivery-${delivery.id}`}
                                      >
                                        Cancelar
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

            {/* Completed Deliveries List - Will continue in part 2... */}
{/* Due to length limitations, I'll need to split this. Let me create a second file for the remaining tabs */}

