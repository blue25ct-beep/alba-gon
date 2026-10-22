import React, { useState, useEffect } from 'react';
import {
  Package,
  FileSpreadsheet,
  ArrowRightLeft,
  Image as ImageIcon,
  RefreshCw,
  Trash2,
  Search,
  Edit3,
  X,
  AlertTriangle,
  Users,
  Share2,
  RotateCcw,
} from 'lucide-react';
import { AuditItem, Product, OrderItem, OrderFailure, BarcodeAlias, WorkerAuth, OrderHistoryEntry } from '../types';
import * as XLSX from 'xlsx';
import { storageService } from '../services/storage';
import { unifiedOrderService, OrderProgressEvent } from '../services/unifiedOrderService';
import { cloudSyncService, SyncStatus } from '../services/cloudSyncService';
import { UnmappedGallery } from '../components/UnmappedGallery';
import { BarcodeAliasModal } from '../components/BarcodeAliasModal';
import { OrderFailureModal } from '../components/OrderFailureModal';
import { ProductStockSetupModal } from '../components/ProductStockSetupModal';
import { RestoreAuditModal } from '../components/RestoreAuditModal';


export const AdminDashboard: React.FC<{ initialCategory?: 'YOUNME' | 'SPCHAIN' | null; onThemeChange?: (theme: 'sage' | 'blue' | 'neutral') => void; onTitleChange?: (title: string) => void }> = ({ initialCategory, onThemeChange, onTitleChange }) => {
  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [aliases, setAliases] = useState<BarcodeAlias[]>([]);
  const [failures, setFailures] = useState<OrderFailure[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ORDER' | 'HISTORY'>('ORDER');
  const [sortUnmodifiedFirst, setSortUnmodifiedFirst] = useState(false);
  const [sessionEdited, setSessionEdited] = useState<Set<string>>(new Set());
  type SortColumn = 'none' | 'targetStock' | 'minOrderQty' | 'finalOrderQty' | 'currentStock';
  type SortOrder = 'asc' | 'desc';
  const [sortColumn, setSortColumn] = useState<SortColumn>('none');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleToggleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortOrder === 'desc') {
        setSortOrder('asc');
      } else {
        setSortColumn('none');
        setSortOrder('desc');
      }
    } else {
      setSortColumn(column);
      setSortOrder('desc');
    }
  };

  // 발주 수량 임시 조정 (barcode -> finalQty)
  const [customQuantities, setCustomQuantities] = useState<Record<string, number>>({});

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('DISCONNECTED');
  const [orderHistory, setOrderHistory] = useState<OrderHistoryEntry[]>(() => storageService.getOrderHistory());

  const historyStats = React.useMemo(() => {
    const history = orderHistory;
    const productStats = new Map<string, { barcode: string; name: string; qty: number; cost: number; sales: number; profit: number; count: number }>();
    
    let totalCost = 0;
    let totalSales = 0;
    
    history.forEach(h => {
      let orderCost = 0;
      let orderSales = 0;
      h.items.forEach((item: any) => {
        const master = products.find(p => p.barcode === item.barcode);
        const qty = item.finalOrderQty || 0;
        const cost = (item.cost !== undefined && item.cost !== null && item.cost > 0) ? item.cost : (master?.cost || 0);
        const price = (item.price !== undefined && item.price !== null && item.price > 0) ? item.price : (master?.price || 0);
        
        const lineCost = cost * qty;
        const lineSales = price * qty;
        
        orderCost += lineCost;
        orderSales += lineSales;

        const current = productStats.get(item.barcode) || { 
          barcode: item.barcode, 
          name: item.productName || master?.name || '알 수 없음', 
          qty: 0, 
          cost: 0, 
          sales: 0, 
          profit: 0, 
          count: 0 
        };
        current.qty += qty;
        current.cost += lineCost;
        current.sales += lineSales;
        current.profit += (lineSales - lineCost);
        current.count += 1;
        productStats.set(item.barcode, current);
      });

      if (orderCost === 0 && h.totalAmount) {
        orderCost = h.totalAmount;
      }
      totalCost += orderCost;
      totalSales += orderSales;
    });

    const totalProfit = Math.max(0, totalSales - totalCost);
    const profitMargin = totalSales > 0 ? Math.round((totalProfit / totalSales) * 1000) / 10 : 0;

    const allStats = Array.from(productStats.values());
    const topBySales = [...allStats].sort((a,b) => b.sales - a.sales).slice(0, 5);
    const topByCost = [...allStats].sort((a,b) => b.cost - a.cost).slice(0, 5);
    
    return { history, totalCost, totalSales, totalProfit, profitMargin, topBySales, topByCost };
  }, [orderHistory, products, activeTab]);

  const handleDeleteHistory = (id: string) => {
    if (!confirm('이 발주 내역을 삭제하시겠습니까? (테스트 기록 삭제 및 통계에서 제외)')) return;
    storageService.deleteOrderHistory(id);
    const updated = storageService.getOrderHistory();
    setOrderHistory(updated);
    cloudSyncService.broadcastOrderHistory(updated);
    cloudSyncService.broadcastBackup();
  };

  const handleClearAllHistory = () => {
    if (!confirm('모든 과거 발주 내역을 삭제하시겠습니까? 통계 데이터가 초기화됩니다.')) return;
    storageService.clearOrderHistory();
    setOrderHistory([]);
    cloudSyncService.broadcastOrderHistory([]);
    cloudSyncService.broadcastBackup();
  };

  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [workers, setWorkers] = useState<WorkerAuth[]>(storageService.getSettings().workers || []);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerId, setNewWorkerId] = useState('');



  const addWorker = () => {
    if (!newWorkerName || !newWorkerId) return;
    const newList = [...workers, { id: newWorkerId, name: newWorkerName }];
    setWorkers(newList);
    storageService.saveSettings({ ...storageService.getSettings(), workers: newList });
    cloudSyncService.publishAuthList(newList);
    setNewWorkerName('');
    setNewWorkerId('');
  };

  const removeWorker = (id: string) => {
    const newList = workers.filter(w => w.id !== id);
    setWorkers(newList);
    storageService.saveSettings({ ...storageService.getSettings(), workers: newList });
    cloudSyncService.publishAuthList(newList);
  };
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [isRefreshingSync, setIsRefreshingSync] = useState(false);

  const [showUnmappedModal, setShowUnmappedModal] = useState(false);
  const [showAliasModal, setShowAliasModal] = useState(false);
  const [aliasTargetBarcode, setAliasTargetBarcode] = useState('');
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [showStockSetupModal, setShowStockSetupModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  const [editingBarcode, setEditingBarcode] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const [isYounmeOrdering, setIsYounmeOrdering] = useState(false);
  const [isSpchainOrdering, setIsSpchainOrdering] = useState(false);
  const [younmeProgress, setYounmeProgress] = useState<OrderProgressEvent | null>(null);
  const [spchainProgress, setSpchainProgress] = useState<OrderProgressEvent | null>(null);
  const [tempFilter, setTempFilter] = useState<'ALL' | 'YOUNME' | 'SPCHAIN' | 'COUPANG'>(initialCategory || 'ALL');
  const [onlyOrdersFilter, setOnlyOrdersFilter] = useState(false);

  const loadData = () => {
    setAudits(storageService.getAudits());
    setProducts(storageService.getProducts());
    setAliases(storageService.getAliases());
    setFailures(storageService.getOrderFailures());
    setOrderHistory(storageService.getOrderHistory());
  };

    useEffect(() => {
    if (tempFilter === 'SPCHAIN') {
      onThemeChange?.('blue');
      onTitleChange?.('🍺 [주류 전용] 자동발주 관리');
    } else if (tempFilter === 'YOUNME') {
      onThemeChange?.('sage');
      onTitleChange?.('🌿 [상온/냉장] 자동발주 관리');
    } else if (tempFilter === 'COUPANG') {
      onThemeChange?.('neutral');
      onTitleChange?.('📦 [수동발주] 쿠팡 전용 관리');
    } else {
      onThemeChange?.('neutral');
      onTitleChange?.('🏢 편의점 통합 자동발주 관리');
    }
  }, [tempFilter, onThemeChange, onTitleChange]);

  useEffect(() => {
    loadData();

    cloudSyncService.connect(undefined, 'ADMIN');

    const unsubSync = cloudSyncService.onSync((newAudits) => {
      setAudits(newAudits);
    });

    const unsubHistory = cloudSyncService.onHistoryUpdate((newHistory) => {
      setOrderHistory(newHistory);
    });

    // PC 로컬 서버(포트 3001)에서 하드디스크 발주 내역 및 실사 목록 직접 확인하여 동기화
    fetch('http://localhost:3001/api/history')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.history) && data.history.length > 0) {
          storageService.saveOrderHistory(data.history, false);
          setOrderHistory(data.history);
        }
      })
      .catch(() => {});

    fetch('http://localhost:3001/api/audits')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.audits) && data.audits.length > 0) {
          storageService.saveAudits(data.audits);
          setAudits(data.audits);
        }
      })
      .catch(() => {});

    fetch('http://localhost:3001/api/products')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.products) && data.products.length > 0) {
          const local = storageService.getProducts();
          const pMap = new Map();
          local.forEach(p => pMap.set(p.barcode, p));
          data.products.forEach((p: Product) => {
            const ex = pMap.get(p.barcode);
            pMap.set(p.barcode, { ...ex, ...p });
          });
          const merged = Array.from(pMap.values());
          storageService.saveProducts(merged, false);
          setProducts(merged);
        }
      })
      .catch(() => {});

    const unsubProducts = cloudSyncService.onProductsUpdate(() => {
      setProducts(storageService.getProducts());
    });

    const unsubAuth = cloudSyncService.onAuthUpdate((newWorkers) => {
      setWorkers(newWorkers);
      storageService.saveSettings({ ...storageService.getSettings(), workers: newWorkers });
    });

    const unsubStatus = cloudSyncService.onStatusChange((st, time) => {
      setSyncStatus(st);
      if (time) setLastSyncTime(time);
    });

    return () => {
      unsubSync();
      unsubStatus();
      unsubHistory();
      unsubProducts();
    };
  }, []);

  // 발주 대상 계산 — 부족분을 최소 발주단위의 배수로 올림
  const orderItems: OrderItem[] = audits.map((audit) => {
    const { product, alias } = storageService.findProduct(audit.barcode);

    const targetStock =
      product && product.targetStock !== undefined
        ? product.targetStock
        : (audit.targetStock !== undefined ? audit.targetStock : 1);

    const minOrderQty =
      product && product.minOrderQty !== undefined
        ? Math.max(1, product.minOrderQty)
        : (audit.minOrderQty !== undefined ? Math.max(1, audit.minOrderQty) : 1);

    const shortage = Math.max(0, targetStock - audit.stockCount);

    const recommendedQty =
      shortage > 0 ? Math.ceil(shortage / minOrderQty) * minOrderQty : 0;

    const finalOrderQty =
      customQuantities[audit.barcode] !== undefined
        ? customQuantities[audit.barcode]
        : recommendedQty;

    const isBelowMinQty = finalOrderQty > 0 && finalOrderQty < minOrderQty;
    const isNotMultiple = finalOrderQty > 0 && finalOrderQty % minOrderQty !== 0;

    const effectiveProductName =
      (product && product.name && product.name !== '미등록 상품')
        ? product.name
        : audit.productName;

    return {
      barcode: audit.barcode,
      productName: effectiveProductName,
      currentStock: audit.stockCount,
      targetStock,
      recommendedQty,
      finalOrderQty,
      minOrderQty,
      isBelowMinQty: isBelowMinQty || isNotMultiple,
      usingAliasBarcode: alias?.newBarcode,
      category: product ? product.category : '기타',
          vendor: audit.vendor,
      cost: product ? product.cost : 0,
      price: product ? product.price : 0,
      status: 'PENDING',
      workerName: audit.workerName,
      updatedAt: audit.updatedAt,
    };
  });

  const allItemsToOrder = orderItems.filter((item) => item.finalOrderQty > 0);
  const coupangItems = allItemsToOrder.filter((item) => item.productName.includes('쿠팡]') || item.productName.startsWith('CP]'));
  const itemsToOrder = allItemsToOrder.filter((item) => !item.productName.includes('쿠팡]') && !item.productName.startsWith('CP]'));
  const younmeItems = itemsToOrder.filter(item => item.vendor === 'younme' || (!item.vendor && (item.category === '상온' || item.category === '냉장' || !item.category)));
  const spchainItems = itemsToOrder.filter(item => item.vendor === 'spchain' || (!item.vendor && item.category === '주류'));


  const handleSnapToMultiple = (barcode: string, val: number, minQty: number) => {
    const step = Math.max(1, minQty);
    setCustomQuantities((prev) => ({
      ...prev,
      [barcode]: Math.ceil(Math.max(1, val) / step) * step,
    }));
  };

  // 증감은 최소 발주단위 배수로만
  const handleStepQty = (
    barcode: string,
    currentVal: number,
    minQty: number,
    direction: 1 | -1
  ) => {
    const step = Math.max(1, minQty);
    const next =
      direction > 0
        ? Math.floor(currentVal / step) * step + step
        : Math.max(0, Math.ceil(currentVal / step) * step - step);

    setCustomQuantities((prev) => ({ ...prev, [barcode]: next }));
  };

  const handleQuantityChange = (barcode: string, val: number) => {
    setCustomQuantities((prev) => ({ ...prev, [barcode]: Math.max(0, val) }));
  };

  
  const handleMarkReviewed = (barcode: string) => {
    storageService.markProductAsReviewed(barcode);
    setSessionEdited(prev => new Set(prev).add(barcode));
    cloudSyncService.broadcastProductsUpdate('ADMIN');
    loadData();
  };

  const handleTargetStockChange = (barcode: string, val: number) => {
    storageService.updateProductTargetStock(barcode, Math.max(0, val));
    setSessionEdited(prev => new Set(prev).add(barcode));
    cloudSyncService.broadcastProductsUpdate('ADMIN');
    loadData();
  };

  const handleMinOrderQtyChange = (barcode: string, val: number) => {
    storageService.updateProductMinOrderQty(barcode, Math.max(1, val));
    setSessionEdited(prev => new Set(prev).add(barcode));
    cloudSyncService.broadcastProductsUpdate('ADMIN');
    loadData();
  };

  const handleRemoveFromOrder = (barcode: string) => {
    storageService.deleteAudit(barcode);
    const updated = storageService.getAudits();
    loadData();
    cloudSyncService.broadcastAudits(updated, 'ADMIN');
  };

  const handleClearAllAudits = () => {
    if (!confirm('실사 목록을 모두 비웁니다. 매장 폰의 목록도 함께 지워집니다.')) return;
    storageService.clearAudits('관리자 목록 비우기');
    setCustomQuantities({});
    loadData();
    cloudSyncService.broadcastClear('ADMIN');
  };

  const handleRefreshCloudSync = () => {
    setIsRefreshingSync(true);
    cloudSyncService.connect(undefined, 'ADMIN');
    loadData();
    setTimeout(() => setIsRefreshingSync(false), 600);
  };

  const handleStartEditName = (barcode: string, currentName: string) => {
    setEditingBarcode(barcode);
    setEditingName(currentName === '미등록 상품' ? '' : currentName);
  };

  const handleSaveName = (barcode: string) => {
    const trimmed = editingName.trim();
    if (trimmed) {
      storageService.registerProductName(barcode, trimmed);
      cloudSyncService.broadcastProductsUpdate('ADMIN');
      cloudSyncService.broadcastAudits(storageService.getAudits(), 'ADMIN');
      loadData();
    }
    setEditingBarcode(null);
    setEditingName('');
  };

  
  const handleStartOrder = async (vendor: 'YOUNME' | 'SPCHAIN', targetItems: OrderItem[]) => {
    if (targetItems.length === 0) {
      alert('발주할 상품이 없습니다.');
      return;
    }

    const sanitizedItems: OrderItem[] = targetItems.map((item) => {
      const step = Math.max(1, item.minOrderQty);
      return {
        ...item,
        barcode: item.usingAliasBarcode || item.barcode,
        finalOrderQty: item.finalOrderQty > 0 ? Math.ceil(item.finalOrderQty / step) * step : 0,
      };
    });

    const vendorName = vendor === 'YOUNME' ? '유앤미24' : '생필체인';
    if (!confirm(`${sanitizedItems.length}개 품목을 ${vendorName} 시스템으로 발주합니다.`)) return;

    if (vendor === 'YOUNME') {
      setIsYounmeOrdering(true);
      setYounmeProgress(null);
    } else {
      setIsSpchainOrdering(true);
      setSpchainProgress(null);
    }

    try {
      const result = await unifiedOrderService.executeOrder(vendor, sanitizedItems, (evt: OrderProgressEvent) => {
        if (vendor === 'YOUNME') setYounmeProgress(evt);
        else setSpchainProgress(evt);
      });

      const successOriginalBarcodes = new Set<string>();
      targetItems.forEach((item) => {
        const sentBarcode = item.usingAliasBarcode || item.barcode;
        const isFailed = result.failures.some((f) => f.barcode === sentBarcode || f.barcode === item.barcode);
        if (!isFailed) {
          successOriginalBarcodes.add(item.barcode);
          if (item.usingAliasBarcode) successOriginalBarcodes.add(item.usingAliasBarcode);
        }
      });

      if (successOriginalBarcodes.size > 0) {
        storageService.updateProductLastOrderDate(Array.from(successOriginalBarcodes));
        
        // Add to history
        const successItems = targetItems.filter((i) => successOriginalBarcodes.has(i.barcode));
        const totalAmount = successItems.reduce((sum, item) => sum + ((item.cost || 0) * item.finalOrderQty), 0);
        storageService.addOrderHistory({
          id: Date.now().toString(),
          orderDate: new Date().toLocaleString('ko-KR'),
          vendor,
          items: successItems,
          totalAmount
        });
        const latestHist = storageService.getOrderHistory();
        setOrderHistory(latestHist);
        cloudSyncService.broadcastOrderHistory(latestHist);
        // 발주 완료된 품목은 언제든 복구할 수 있도록 직전 백업에 보존
        const orderedAuditsToBackup: AuditItem[] = successItems.map((it, idx) => ({
          id: (Date.now() + idx).toString(),
          barcode: it.barcode,
          productName: it.productName,
          vendor: it.vendor || (vendor === 'SPCHAIN' ? 'spchain' : 'younme'),
          stockCount: it.currentStock ?? 0,
          targetStock: it.targetStock ?? (it.minOrderQty || 1),
          minOrderQty: it.minOrderQty ?? 1,
          workerName: (it as any).workerName || '발주완료',
          updatedAt: (it as any).updatedAt || new Date().toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          isUnmapped: false,
        }));
        storageService.saveLastClearedAudits(orderedAuditsToBackup, `${vendorName} 발주 완료`);

        // 발주 완료된 품목은 실사 목록에서 자동 제거하여 중복 발주 방지 (로컬 및 원격 즉시 반영)
        const remainingAudits = storageService.getAudits().filter((a) => !successOriginalBarcodes.has(a.barcode));
        storageService.saveAudits(remainingAudits);
        setAudits(remainingAudits);
        if (remainingAudits.length === 0) {
          cloudSyncService.broadcastClear('ADMIN');
        } else {
          cloudSyncService.broadcastAudits(remainingAudits, 'ADMIN');
        }
        cloudSyncService.broadcastBackup(); // Ensure backup is updated

        // 발주 완료 결과를 디스코드로 자동 전송
        const dateStr = new Date().toLocaleString('ko-KR');
        let orderReport = `🎉 **[발주 완료 보고 - ${vendorName}]**\n` +
          `• **처리일시**: ${dateStr}\n` +
          `• **결과**: 총 ${sanitizedItems.length}건 중 성공 **${successItems.length}건**` +
          (result.failures.length > 0 ? ` (실패 ${result.failures.length}건)` : '') +
          `\n────────────────────────\n`;

        successItems.forEach((item, idx) => {
          orderReport += `${idx + 1}. ${item.productName}, ${item.barcode}, 재고: ${item.currentStock}개\n`;
        });

        if (result.failures.length > 0) {
          orderReport += `⚠️ **[발주 실패 품목]**\n` + result.failures.map(f => `• ${f.productName || f.barcode}: ${f.failDetail || f.failReason || '실패'}`).join('\n');
        }

        const webhookUrl = storageService.getSettings().discordWebhookUrl;
        if (webhookUrl) {
          fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: orderReport })
          }).catch(console.error);
        }
      }
      loadData();
      if (result.failures.length > 0) {
        setShowFailureModal(true);
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '발주 중 오류가 발생했습니다.');
    } finally {
      if (vendor === 'YOUNME') setIsYounmeOrdering(false);
      else setIsSpchainOrdering(false);
    }
  };

  const handleExcelDownload = () => {
    const products = storageService.getProducts();
    if (products.length === 0) {
      alert('내보낼 상품 데이터가 없습니다.');
      return;
    }

    const data = products.map(p => ({
      '바코드': p.barcode,
      '상품명': p.name,
      '카테고리': p.category,
      '매가': p.price,
      '원가': p.cost,
      '목표재고': p.targetStock,
      '최소발주단위': p.minOrderQty,
      '마지막수정일': p.updatedAt || '기록없음',
      '마지막발주일': p.lastOrderDate || '기록없음'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '마스터_상품목록');
    XLSX.writeFile(wb, `알바곤_상품마스터_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  
  const handleRestoreAudits = () => {
    setShowRestoreModal(true);
  };

  const handleShareOrdersToDiscord = async () => {
    const targetItems = tempFilter === 'ALL'
      ? allItemsToOrder
      : tempFilter === 'YOUNME'
        ? younmeItems
        : tempFilter === 'SPCHAIN'
          ? spchainItems
          : coupangItems;

    if (targetItems.length === 0) {
      alert('현재 발주 예정인 상품이 없습니다.');
      return;
    }

    const filterName = tempFilter === 'ALL' ? '전체' : tempFilter === 'YOUNME' ? '유앤미24(상온/냉장)' : tempFilter === 'SPCHAIN' ? '생필체인(주류/저온)' : '쿠팡(수동)';
    const dateStr = new Date().toLocaleString('ko-KR');

    const header = `📢 **[발주 리스트 공유 - ${filterName} (${targetItems.length}건)]**\n발주서 작성일시: ${dateStr}\n────────────────────────\n`;
    
    // 제품명 -> 바코드 -> 발주 정보/수량 -> 발주자/구분 정보 순서
    const itemLines = targetItems.map((item, idx) => {
      const vendorText = item.vendor === 'spchain' ? '생필체인' : item.vendor === 'younme' ? '유앤미24' : item.category || '기타';
      const workerText = item.workerName ? ` | 발주자: ${item.workerName}` : '';
      return `${idx + 1}. **${item.productName}**\n` +
        `• 바코드: \`${item.barcode}\`\n` +
        `• 수량: 재고 ${item.currentStock}개 / 목표 ${item.targetStock}개 ➔ **발주 ${item.finalOrderQty}개**\n` +
        `• 구분: ${vendorText}${workerText}`;
    });

    const fullMessage = header + itemLines.join('\n\n');

    const webhookUrl = storageService.getSettings().discordWebhookUrl;
    if (webhookUrl) {
      let currentChunk = header;
      for (const line of itemLines) {
        if ((currentChunk + '\n\n' + line).length > 1850) {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: currentChunk })
          }).catch(console.error);
          currentChunk = line;
        } else {
          currentChunk += (currentChunk === header ? '' : '\n\n') + line;
        }
      }
      if (currentChunk) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: currentChunk })
        }).catch(console.error);
      }
    }

    try {
      await navigator.clipboard.writeText(fullMessage);
    } catch(e) {}

    alert(`✅ 디스코드로 발주 리스트(${targetItems.length}건)를 전송했습니다!\n(클립보드에도 복사되어 카카오톡/문자로 바로 붙여넣기 하실 수 있습니다)`);
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await storageService.importExcelFile(file);
      alert(`${result.count}개 상품을 불러왔습니다.`);
      loadData();
    } catch {
      alert('엑셀 파일을 읽지 못했습니다.');
    }
  };

  const unmappedAudits = audits.filter((a) => a.isUnmapped);

  let filteredItems = orderItems.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode.includes(searchQuery);

    const isChilled = Boolean(
      item.category?.includes('냉동') || item.category?.includes('저온')
    );
    let matchesTemp = true;
    const isCoupangItem = item.productName.includes('쿠팡]') || item.productName.startsWith('CP]');
    const isYounmeItem = !isCoupangItem && (item.vendor === 'younme' || (!item.vendor && (item.category === '상온' || item.category === '냉장' || !item.category)));
    
    if (tempFilter === 'YOUNME') matchesTemp = isYounmeItem;
    if (tempFilter === 'SPCHAIN') matchesTemp = !isYounmeItem && !isCoupangItem;
    if (tempFilter === 'COUPANG') matchesTemp = isCoupangItem;

    const matchesOnlyOrders = !onlyOrdersFilter || item.finalOrderQty > 0;
    return matchesSearch && matchesTemp && matchesOnlyOrders;
  });

  
  if (sortColumn !== 'none') {
    filteredItems.sort((a, b) => {
      const valA = (a as any)[sortColumn] ?? 0;
      const valB = (b as any)[sortColumn] ?? 0;
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });
  }

  if (sortUnmodifiedFirst) {
    filteredItems.sort((a, b) => {
      const pA = products.find(p => p.barcode === a.barcode);
      const pB = products.find(p => p.barcode === b.barcode);
      const isUnmodA = !pA?.updatedAt || sessionEdited.has(a.barcode);
      const isUnmodB = !pB?.updatedAt || sessionEdited.has(b.barcode);
      if (isUnmodA && !isUnmodB) return -1;
      if (!isUnmodA && isUnmodB) return 1;
      return 0;
    });
  }

  const isConnected = syncStatus === 'CONNECTED';

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 py-8 space-y-8 pb-24">
      <div className="text-center text-ink-faint text-xs py-1">최종 업데이트: {__BUILD_TIME__}</div>

      <div className="flex border-b border-line mb-6">
        <button onClick={() => setActiveTab('ORDER')} className={`px-4 py-2 font-semibold ${activeTab === 'ORDER' ? 'border-b-2 border-sage-600 text-sage-600' : 'text-ink-faint hover:text-ink'}`}>현재 발주 관리</button>
        <button onClick={() => setActiveTab('HISTORY')} className={`px-4 py-2 font-semibold ${activeTab === 'HISTORY' ? 'border-b-2 border-sage-600 text-sage-600' : 'text-ink-faint hover:text-ink'}`}>발주 내역 및 통계</button>
      </div>
      
      {activeTab === 'HISTORY' && (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-sunken/60 p-3.5 rounded-2xl border border-line text-xs">
            <div className="flex items-center gap-2 text-ink">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-bold">💾 점장님 PC 영구 저장소 연동됨</span>
              <span className="text-ink-faint">| 총 {historyStats.history.length}건 보관 중 (PC 하드디스크 & 클라우드 실시간 동기화)</span>
            </div>
            {historyStats.history.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllHistory}
                className="text-brick hover:underline font-medium ml-auto"
              >
                전체 기록 초기화
              </button>
            )}
          </div>

          {historyStats.history.length === 0 ? (
            <p className="text-ink-faint text-center py-10">기록된 발주 내역이 없습니다.</p>
          ) : (
            <>
              {/* 상단 핵심 지표 요약 (예상 매출액 / 매입 원가 / 예상 마진) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm">
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                    총 누적 예상 매출액 (판매금액)
                  </div>
                  <div className="text-2xl font-black text-emerald-700 tabular">
                    {historyStats.totalSales.toLocaleString()}원
                  </div>
                  <div className="text-xs text-emerald-600 mt-1">발주 상품 판매가(소비자가) 기준 합계</div>
                </div>

                <div className="bg-canvas border border-line rounded-xl p-5 shadow-sm">
                  <div className="text-xs font-bold text-ink-faint uppercase tracking-wider mb-1">
                    총 누적 매입 원가
                  </div>
                  <div className="text-2xl font-black text-ink tabular">
                    {historyStats.totalCost.toLocaleString()}원
                  </div>
                  <div className="text-xs text-ink-faint mt-1">발주 납품 매입원가 합계</div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-sm">
                  <div className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">
                    예상 총 마진 / 마진율
                  </div>
                  <div className="text-2xl font-black text-blue-700 tabular">
                    +{historyStats.totalProfit.toLocaleString()}원
                  </div>
                  <div className="text-xs font-bold text-blue-600 mt-1">
                    평균 마진율: {historyStats.profitMargin}%
                  </div>
                </div>
              </div>

              {/* 통계 랭킹 대시보드: 매출 기여도 Top 5 vs 매입 금액 Top 5 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-canvas border border-line rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
                    💰 매출 기여도 Top 5 (판매금액 순)
                  </h3>
                  <div className="space-y-3">
                    {historyStats.topBySales.length === 0 ? (
                      <p className="text-xs text-ink-faint py-3 text-center">집계된 매출 데이터가 없습니다.</p>
                    ) : (
                      historyStats.topBySales.map((stat, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="text-ink truncate pr-2">
                            <span className="font-bold text-emerald-600 mr-2">{i+1}</span>
                            {stat.name}
                            <span className="text-xs text-ink-faint ml-1">({stat.qty}개)</span>
                          </span>
                          <span className="font-bold text-emerald-700 tabular shrink-0">
                            {stat.sales.toLocaleString()}원
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-canvas border border-line rounded-xl p-5 shadow-sm">
                  <h3 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
                    💸 매입 금액 랭킹 Top 5 (원가 지출 순)
                  </h3>
                  <div className="space-y-3">
                    {historyStats.topByCost.length === 0 ? (
                      <p className="text-xs text-ink-faint py-3 text-center">집계된 매입 데이터가 없습니다.</p>
                    ) : (
                      historyStats.topByCost.map((stat, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="text-ink truncate pr-2">
                            <span className="font-bold text-red-500 mr-2">{i+1}</span>
                            {stat.name}
                            <span className="text-xs text-ink-faint ml-1">({stat.qty}개)</span>
                          </span>
                          <span className="font-semibold text-ink tabular shrink-0">
                            {stat.cost.toLocaleString()}원
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* 과거 내역 리스트 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-ink">과거 발주 상세 내역</h2>
                  {historyStats.history.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllHistory}
                      className="text-xs font-semibold text-brick hover:underline transition-colors"
                    >
                      전체 내역 비우기
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {historyStats.history.map((history) => {
                    const orderCost = history.items.reduce((sum: number, it: any) => {
                      const master = products.find(p => p.barcode === it.barcode);
                      const cost = (it.cost !== undefined && it.cost !== null && it.cost > 0) ? it.cost : (master?.cost || 0);
                      return sum + cost * (it.finalOrderQty || 0);
                    }, 0) || history.totalAmount || 0;

                    const orderSales = history.items.reduce((sum: number, it: any) => {
                      const master = products.find(p => p.barcode === it.barcode);
                      const price = (it.price !== undefined && it.price !== null && it.price > 0) ? it.price : (master?.price || 0);
                      return sum + price * (it.finalOrderQty || 0);
                    }, 0);

                    const orderProfit = Math.max(0, orderSales - orderCost);
                    const orderMargin = orderSales > 0 ? Math.round((orderProfit / orderSales) * 1000) / 10 : 0;

                    return (
                      <div key={history.id} className="bg-canvas border border-line rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-ink text-base">
                              {history.orderDate} - {history.vendor === 'YOUNME' ? '유앤미24' : '생필체인'}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium mt-1">
                              <span className="text-emerald-700 font-semibold">
                                예상 매출: {orderSales.toLocaleString()}원
                              </span>
                              <span className="text-ink-faint">
                                매입 원가: {orderCost.toLocaleString()}원
                              </span>
                              {orderSales > 0 && (
                                <span className="text-blue-600 font-medium">
                                  마진: +{orderProfit.toLocaleString()}원 ({orderMargin}%)
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-sage-600 bg-sage-50 px-2 py-1 rounded font-medium">성공: {history.items.length}품목</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteHistory(history.id)}
                              className="p-1.5 text-ink-faint hover:text-brick rounded-lg hover:bg-brick/10 transition-colors"
                              title="이 발주 내역 삭제 (테스트 데이터 정리)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-ink-faint border-t border-line pt-3 flex flex-wrap gap-2">
                          {history.items.slice(0, 10).map((item: any, idx: number) => (
                            <span key={idx} className="bg-surface px-1.5 py-0.5 rounded border border-line">
                              {item.productName} <strong className="text-ink">({item.finalOrderQty}개)</strong>
                            </span>
                          ))}
                          {history.items.length > 10 && (
                            <span className="bg-surface px-1.5 py-0.5 rounded border border-line text-ink font-semibold">
                              외 {history.items.length - 10}건...
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {activeTab === 'ORDER' && (
        <>
  
      {/* 요약 */}
      <section className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div className="flex flex-wrap items-end gap-x-10 gap-y-5">
          <div>
            <p className="text-sm text-ink-faint">실사 품목</p>
            <p className="mt-1 text-[32px] leading-none font-semibold text-ink tabular">
              {audits.length}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOnlyOrdersFilter(prev => !prev)}
            className={`text-left group transition-all p-2 -m-2 rounded-2xl ${
              onlyOrdersFilter ? 'bg-sage-100 ring-2 ring-sage shadow-sm' : 'hover:bg-sunken'
            }`}
            title="클릭 시 발주 예정 품목만 바로 필터링합니다"
          >
            <p className="text-sm text-ink-faint group-hover:text-ink-soft transition-colors flex items-center gap-1.5">
              <span>발주 예정</span>
              {onlyOrdersFilter && (
                <span className="text-[10px] bg-sage text-white px-1.5 py-0.2 rounded-full font-bold">
                  필터 ON
                </span>
              )}
            </p>
            <p className="mt-1 text-[32px] leading-none font-semibold text-sage tabular">
              {itemsToOrder.length}
            </p>
          </button>

          {coupangItems.length > 0 && (
            <div>
              <p className="text-sm text-ink-faint">📦 쿠팡 주문 필요</p>
              <p className="mt-1 text-[32px] leading-none font-semibold text-blue-500 tabular">
                {coupangItems.length}
              </p>
            </div>
          )}

          {unmappedAudits.length > 0 && (
            <button
              onClick={() => setShowUnmappedModal(true)}
              className="text-left group"
            >
              <p className="text-sm text-ink-faint group-hover:text-ink-soft transition-colors">
                이름 없는 상품
              </p>
              <p className="mt-1 text-[32px] leading-none font-semibold text-clay tabular underline decoration-clay/30 underline-offset-4">
                {unmappedAudits.length}
              </p>
            </button>
          )}

          {failures.length > 0 && (
            <button onClick={() => setShowFailureModal(true)} className="text-left group">
              <p className="text-sm text-ink-faint group-hover:text-ink-soft transition-colors">
                발주 실패
              </p>
              <p className="mt-1 text-[32px] leading-none font-semibold text-brick tabular underline decoration-brick/30 underline-offset-4">
                {failures.length}
              </p>
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 text-[13px] text-ink-faint">
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-sage' : 'bg-clay'}`}
              aria-hidden
            />
            {isConnected ? '매장과 연결됨' : '연결 중'}
            {lastSyncTime && ` · ${lastSyncTime}`}
          </span>
          <button
            type="button"
            onClick={handleRefreshCloudSync}
            disabled={isRefreshingSync}
            className="inline-flex items-center gap-1.5 hover:text-ink transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingSync ? 'animate-spin' : ''}`} />
            새로고침
          </button>
        </div>
      </section>

      {/* 발주 실행 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 유앤미 발주 섹션 */}
        {(tempFilter === "ALL" || tempFilter === "YOUNME") && (
        <section className="bg-white border border-line rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-sage-deep mb-2">🌿 유앤미24 발주</h3>
            <p className="text-sm text-ink-soft mb-6 break-keep">
              상온/냉장 카테고리 상품들을 유앤미24 시스템을 통해 자동 발주합니다.
            </p>
          </div>
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Package className="w-4 h-4 text-sage" />
                <span className="text-sm font-medium text-ink">{younmeItems.length}개 대기중</span>
              </div>
            </div>
            <button
              disabled={isYounmeOrdering || younmeItems.length === 0 || isSpchainOrdering}
              onClick={() => handleStartOrder('YOUNME', younmeItems)}
              className="h-10 px-6 rounded-full bg-sage hover:bg-sage-deep disabled:bg-sunken disabled:text-ink-faint text-white text-sm font-medium transition-colors"
            >
              {isYounmeOrdering ? '발주 중' : '발주하기'}
            </button>
          </div>
          {younmeProgress && (
            <div className="mt-4 p-4 bg-sage-50 rounded-2xl animate-settle">
              <div className="flex justify-between items-center gap-4 text-sm mb-2">
                <span className="text-sage-deep font-medium break-keep">{younmeProgress.message}</span>
                <span className="text-sage font-bold tabular shrink-0">{younmeProgress.percent}%</span>
              </div>
              <div className="w-full h-1.5 bg-sage-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sage transition-all duration-300 ease-out"
                  style={{ width: `${younmeProgress.percent}%` }}
                />
              </div>
            </div>
          )}
        </section>
        )}
        {(tempFilter === "ALL" || tempFilter === "SPCHAIN") && (
        <section className="bg-white border border-blue-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-blue-700 mb-2">🍺 생필체인(주류) 발주</h3>
            <p className="text-sm text-ink-soft mb-6 break-keep">
              주류 카테고리 상품들을 생필체인 시스템을 통해 박스 단위로 자동 발주합니다.
            </p>
          </div>
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Package className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-ink">{spchainItems.length}개 대기중</span>
              </div>
            </div>
            <button
              disabled={isSpchainOrdering || spchainItems.length === 0 || isYounmeOrdering}
              onClick={() => handleStartOrder('SPCHAIN', spchainItems)}
              className="h-10 px-6 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-sunken disabled:text-ink-faint text-white text-sm font-medium transition-colors"
            >
              {isSpchainOrdering ? '발주 중' : '발주하기'}
            </button>
          </div>
          {spchainProgress && (
            <div className="mt-4 p-4 bg-blue-50 rounded-2xl animate-settle">
              <div className="flex justify-between items-center gap-4 text-sm mb-2">
                <span className="text-blue-800 font-medium break-keep">{spchainProgress.message}</span>
                <span className="text-blue-600 font-bold tabular shrink-0">{spchainProgress.percent}%</span>
              </div>
              <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 ease-out"
                  style={{ width: `${spchainProgress.percent}%` }}
                />
              </div>
            </div>
          )}
        </section>
        )}
      </div>
      
      {/* 액션 버튼 그룹 */}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <button
          onClick={() => setShowStockSetupModal(true)}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-medium text-ink-soft hover:text-ink hover:bg-sunken transition-colors bg-white border border-line"
        >
          <Package className="w-4 h-4" />
          목표 재고
          <span className="text-ink-faint tabular">{products.length}</span>
        </button>

        <button
          onClick={() => {
            setAliasTargetBarcode('');
            setShowAliasModal(true);
          }}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-medium text-ink-soft hover:text-ink hover:bg-sunken transition-colors bg-white border border-line"
        >
          <ArrowRightLeft className="w-4 h-4" />
          대체 바코드
          <span className="text-ink-faint tabular">{aliases.length}</span>
        </button>

        <label className="inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-medium text-ink-soft hover:text-ink hover:bg-sunken cursor-pointer transition-colors bg-white border border-line">
          <FileSpreadsheet className="w-4 h-4" />
          엑셀 불러오기
          <input
            type="file"
            accept=".xls,.xlsx,.csv"
            onChange={handleExcelUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* 목록 */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1 text-sm">
            {(
              [
                ['ALL', '전체'],
                ['YOUNME', '유앤미24'],
                ['SPCHAIN', '생필체인(주류)'],
                ['COUPANG', '쿠팡(수동)'],
                
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTempFilter(key)}
                className={`h-9 px-4 rounded-full font-medium transition-colors ${
                  tempFilter === key
                    ? 'bg-ink text-white'
                    : 'text-ink-soft hover:bg-sunken'
                }`}
              >
                {label}
              </button>
            ))}
            
          {onlyOrdersFilter && (
              <button
                type="button"
                onClick={() => setOnlyOrdersFilter(false)}
                className="h-9 px-3.5 rounded-full font-medium text-xs text-sage-800 bg-sage-100 hover:bg-sage-200 transition-colors flex items-center gap-1.5 shadow-sm"
                title="전체 실사 목록으로 돌아가기"
              >
                <span>🛒 발주 예정만 보는 중</span>
                <span className="font-bold ml-1">✕</span>
              </button>
            )}
            {audits.length === 0 && (
            <button
              onClick={handleRestoreAudits}
              className="h-9 px-4 rounded-full font-medium text-red-600 bg-red-100 hover:bg-red-200 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              🚨 삭제/발주 데이터 복구하기
            </button>
          )}
          {audits.length > 0 && (
            <>
              <button
                onClick={handleRestoreAudits}
                className="h-9 px-4 rounded-full font-medium text-amber-700 bg-amber-100/70 hover:bg-amber-200/80 transition-colors flex items-center gap-1.5"
                title="직전 발주 품목 또는 실수로 지운 실사 목록 복구"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                데이터 복구
              </button>
              <button
                onClick={handleClearAllAudits}
                className="h-9 px-4 rounded-full font-medium text-ink-faint hover:text-brick hover:bg-brick-soft transition-colors"
              >
                목록 비우기
              </button>
            </>
          )}
            {/* Worker Management Button */}
            <button
              onClick={() => setShowWorkerModal(true)}
              className="h-9 px-4 rounded-full font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              👥 근무자 관리
            </button>
          </div>


          <div className="flex flex-col gap-2 w-full md:w-72">
            <div className="relative w-full">
            <Search className="w-4 h-4 text-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="상품명 또는 바코드"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="상품 검색"
              className="w-full h-10 pl-10 pr-4 rounded-full bg-surface border border-line text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-sage-300 transition-colors"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-ink-faint font-semibold">정렬:</span>
              <button
                type="button"
                onClick={() => {
                  if (sortColumn === 'targetStock' && sortOrder === 'desc') {
                    setSortColumn('none');
                  } else {
                    setSortColumn('targetStock');
                    setSortOrder('desc');
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1 ${
                  sortColumn === 'targetStock' && sortOrder === 'desc'
                    ? 'bg-sage-600 text-white border-sage-600 shadow-sm'
                    : 'bg-surface text-ink hover:bg-canvas border-line'
                }`}
              >
                <span>🎯 목표 수량 많은순 (내림차순)</span>
                {sortColumn === 'targetStock' && <span className="text-[11px]">{sortOrder === 'desc' ? '▼' : '▲'}</span>}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (sortColumn === 'minOrderQty' && sortOrder === 'desc') {
                    setSortColumn('none');
                  } else {
                    setSortColumn('minOrderQty');
                    setSortOrder('desc');
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1 ${
                  sortColumn === 'minOrderQty' && sortOrder === 'desc'
                    ? 'bg-sage-600 text-white border-sage-600 shadow-sm'
                    : 'bg-surface text-ink hover:bg-canvas border-line'
                }`}
              >
                <span>📦 발주 단위 큰순 (내림차순)</span>
                {sortColumn === 'minOrderQty' && <span className="text-[11px]">{sortOrder === 'desc' ? '▼' : '▲'}</span>}
              </button>
              {sortColumn !== 'none' && (
                <button
                  type="button"
                  onClick={() => setSortColumn('none')}
                  className="px-2 py-1 text-xs text-ink-faint hover:text-ink underline transition-colors"
                >
                  기본 순서로 복귀
                </button>
              )}
            </div>
            <label className="flex items-center gap-2 text-[13px] text-ink font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={sortUnmodifiedFirst}
                onChange={(e) => {
                  setSortUnmodifiedFirst(e.target.checked);
                  if (!e.target.checked) setSessionEdited(new Set()); // reset when turned off
                }}
                className="w-4 h-4 text-sage-600 rounded border-line focus:ring-sage-500"
              />
              💡 수정 안 된 상품 위로 올리기
            </label>
          </div>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <p className="py-16 text-center text-sm text-ink-faint">
            {orderItems.length === 0
              ? '매장에서 스캔한 재고가 아직 없습니다'
              : '검색 결과가 없습니다'}
          </p>
        ) : (
          <div className="bg-surface border border-line rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[13px] text-ink-faint border-b border-line">
                    <th className="font-medium px-5 py-3">상품</th>
                    <th className="font-medium px-3 py-3 text-right whitespace-nowrap">재고</th>
                    <th
                      onClick={() => handleToggleSort('targetStock')}
                      className="font-medium px-3 py-3 text-center whitespace-nowrap cursor-pointer hover:bg-canvas transition-colors select-none group"
                      title="클릭하여 목표 수량 내림차순/오름차순 정렬"
                    >
                      <div className="inline-flex items-center gap-1 justify-center">
                        <span>목표</span>
                        {sortColumn === 'targetStock' ? (
                          <span className="text-sage-600 font-bold">{sortOrder === 'desc' ? '▼' : '▲'}</span>
                        ) : (
                          <span className="text-ink-faint opacity-40 group-hover:opacity-100 text-xs">↕</span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleToggleSort('minOrderQty')}
                      className="font-medium px-3 py-3 text-center whitespace-nowrap cursor-pointer hover:bg-canvas transition-colors select-none group"
                      title="클릭하여 발주 단위 내림차순/오름차순 정렬"
                    >
                      <div className="inline-flex items-center gap-1 justify-center">
                        <span>발주단위</span>
                        {sortColumn === 'minOrderQty' ? (
                          <span className="text-sage-600 font-bold">{sortOrder === 'desc' ? '▼' : '▲'}</span>
                        ) : (
                          <span className="text-ink-faint opacity-40 group-hover:opacity-100 text-xs">↕</span>
                        )}
                      </div>
                    </th>
                    <th className="font-medium px-3 py-3 text-right whitespace-nowrap">추천</th>
                    <th className="font-medium px-3 py-3 text-center whitespace-nowrap">
                      발주 수량
                    </th>
                    <th className="px-3 py-3">
                      <span className="sr-only">제외</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredItems.map((item) => {
                    const audit = audits.find((a) => a.barcode === item.barcode);
                    const { product: matchedProd } = storageService.findProduct(item.barcode);
                    const isUnregistered =
                      (!matchedProd || !matchedProd.name || matchedProd.name === '미등록 상품') &&
                      (item.productName === '미등록 상품' || !item.productName);

                    return (
                      <tr key={item.barcode} className="hover:bg-canvas/60 transition-colors">
                        {/* 상품 */}
                        <td className="px-5 py-3 max-w-md">
                          {editingBarcode === item.barcode ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveName(item.barcode);
                                  if (e.key === 'Escape') setEditingBarcode(null);
                                }}
                                placeholder="상품명"
                                autoFocus
                                className="flex-1 min-w-0 h-9 px-3 rounded-lg bg-canvas border border-sage-300 text-sm text-ink focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveName(item.barcode)}
                                className="h-9 px-3 rounded-lg bg-sage hover:bg-sage-deep text-white text-[13px] font-medium shrink-0 transition-colors"
                              >
                                저장
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingBarcode(null)}
                                className="h-9 px-2 text-[13px] text-ink-faint hover:text-ink shrink-0 transition-colors"
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2.5 group">
                              {(audit?.photoUrls?.length ? audit.photoUrls : audit?.photoUrl ? [audit.photoUrl] : []).map((p, i) => (
                                <button
                                  type="button"
                                  key={i}
                                  onClick={() => setPreviewPhotoUrl(p)}
                                  className="w-9 h-9 rounded-lg overflow-hidden border border-line shrink-0"
                                  aria-label="촬영한 사진 보기"
                                >
                                  <img
                                    src={p}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ))}

                              <span className="min-w-0">
                                {/* 1. 제품명 */}
                                <span
                                  className={`block leading-snug break-keep ${
                                    isUnregistered ? 'text-clay' : 'text-ink'
                                  }`}
                                >
                                  {item.productName}
                                </span>
                                {/* 2. 바코드 */}
                                <span className="block mt-0.5 text-[13px] text-ink-faint tabular">
                                  {item.barcode}
                                  {item.usingAliasBarcode && ` → ${item.usingAliasBarcode}`}
                                </span>
                                {/* 3. 이후 발주자(근무자) 정보 및 검수 상태 등 */}
                                {(() => {
                                  const masterProduct = products.find(p => p.barcode === item.barcode);
                                  return (
                                    <span className="flex flex-wrap items-center gap-2 mt-1">
                                      {item.workerName && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 align-middle whitespace-nowrap">
                                          👤 {item.workerName} {item.updatedAt ? `(${item.updatedAt.replace(/:d{2}$/, '')})` : ''}
                                        </span>
                                      )}
                                      {masterProduct?.reviewStatus === 'APPROPRIATE' ? (
                                        <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-1 shadow-sm">
                                          ✅ 적절함 확인: {masterProduct.reviewedAt || masterProduct.updatedAt}
                                        </span>
                                      ) : (masterProduct?.reviewStatus === 'MODIFIED' || masterProduct?.updatedAt) ? (
                                        <span className="text-[11px] text-sage-700 bg-sage-50 border border-sage-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-1 shadow-sm">
                                          ✏️ 수정됨: {masterProduct.updatedAt}
                                        </span>
                                      ) : (
                                        <div className="inline-flex items-center gap-1.5">
                                          <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                                            ⚠️ 미확인
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => handleMarkReviewed(item.barcode)}
                                            className="text-[11px] text-white bg-sage hover:bg-sage-deep px-2 py-0.5 rounded font-medium transition-colors shadow-sm"
                                            title="이 상품의 현재 목표재고 및 발주단위를 영구 승인합니다."
                                          >
                                            ✅ 현재 값 적절함
                                          </button>
                                        </div>
                                      )}
                                      {masterProduct?.lastOrderDate && (
                                        <span className="text-[11px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                                          📦 마지막 발주: {masterProduct.lastOrderDate}
                                        </span>
                                      )}
                                    </span>
                                  );
                                })()}
                                {(item.productName.includes('쿠팡]') || item.productName.startsWith('CP]')) && (
                                  <button
                                    onClick={() => {
                                      const url = `https://www.coupang.com/np/search?q=${encodeURIComponent(item.productName.replace('쿠팡]', '').replace('CP]', '').trim())}`;
                                      const w = window.open('', '_blank');
                                      if (w) w.location.href = url;
                                    }}
                                    className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                  >
                                    쿠팡 구매 링크
                                  </button>
                                )}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  handleStartEditName(item.barcode, item.productName)
                                }
                                aria-label="상품명 수정"
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                  isUnregistered
                                    ? 'text-clay hover:bg-clay-soft'
                                    : 'text-ink-faint hover:text-ink hover:bg-sunken opacity-0 group-hover:opacity-100 focus:opacity-100'
                                }`}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* 재고 */}
                        <td className="px-3 py-3 text-right text-ink tabular whitespace-nowrap">
                          {item.currentStock}
                        </td>

                        {/* 목표 재고 */}
                        <td className="px-3 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            value={item.targetStock}
                            onChange={(e) =>
                              handleTargetStockChange(
                                item.barcode,
                                parseInt(e.target.value) || 0
                              )
                            }
                            aria-label="목표 재고"
                            className="w-14 h-9 text-center rounded-lg bg-canvas border border-line text-ink tabular focus:outline-none focus:border-sage-300 transition-colors"
                          />
                        </td>

                        {/* 최소 발주단위 */}
                        <td className="px-3 py-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.minOrderQty}
                            onChange={(e) =>
                              handleMinOrderQtyChange(
                                item.barcode,
                                parseInt(e.target.value) || 1
                              )
                            }
                            aria-label="최소 발주단위"
                            className="w-14 h-9 text-center rounded-lg bg-canvas border border-line text-ink tabular focus:outline-none focus:border-sage-300 transition-colors"
                          />
                        </td>

                        {/* 추천 */}
                        <td className="px-3 py-3 text-right tabular whitespace-nowrap">
                          <span className={item.recommendedQty > 0 ? 'text-ink' : 'text-ink-faint'}>
                            {item.recommendedQty}
                          </span>
                        </td>

                        {/* 발주 수량 */}
                        <td className="px-3 py-3">
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="inline-flex items-center rounded-full border border-line overflow-hidden">
                              <button
                                type="button"
                                onClick={() =>
                                  handleStepQty(
                                    item.barcode,
                                    item.finalOrderQty,
                                    item.minOrderQty,
                                    -1
                                  )
                                }
                                disabled={item.finalOrderQty <= 0}
                                aria-label={`${item.minOrderQty}개 감소`}
                                className="w-9 h-9 text-ink-soft hover:bg-sunken disabled:text-ink-faint disabled:hover:bg-transparent transition-colors"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min="0"
                                step={item.minOrderQty}
                                value={item.finalOrderQty}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    item.barcode,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                aria-label="발주 수량"
                                className={`w-14 h-9 text-center bg-transparent tabular focus:outline-none ${
                                  item.finalOrderQty > 0 ? 'text-ink font-medium' : 'text-ink-faint'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleStepQty(
                                    item.barcode,
                                    item.finalOrderQty,
                                    item.minOrderQty,
                                    1
                                  )
                                }
                                aria-label={`${item.minOrderQty}개 증가`}
                                className="w-9 h-9 text-ink-soft hover:bg-sunken transition-colors"
                              >
                                +
                              </button>
                            </div>

                            {item.isBelowMinQty && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleSnapToMultiple(
                                    item.barcode,
                                    item.finalOrderQty,
                                    item.minOrderQty
                                  )
                                }
                                className="inline-flex items-center gap-1 text-[13px] text-clay hover:underline whitespace-nowrap"
                              >
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                {item.minOrderQty}개 단위로 맞추기
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 제외 */}
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveFromOrder(item.barcode)}
                            aria-label={`${item.productName} 발주 목록에서 제외`}
                            className="w-9 h-9 rounded-full text-ink-faint hover:text-brick hover:bg-brick-soft flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {showUnmappedModal && (
        <UnmappedGallery
          unmappedAudits={unmappedAudits}
          onProductMapped={() => { cloudSyncService.broadcastProductsUpdate('ADMIN'); loadData(); }}
          onClose={() => setShowUnmappedModal(false)}
        />
      )}

      {showAliasModal && (
        <BarcodeAliasModal
          initialOldBarcode={aliasTargetBarcode}
          onClose={() => setShowAliasModal(false)}
          />
      )}

      {showFailureModal && (
        <OrderFailureModal
          failures={failures}
          onUpdate={loadData}
          onClose={() => setShowFailureModal(false)}
          onOpenAliasModal={(code) => {
            setShowFailureModal(false);
            setAliasTargetBarcode(code);
            setShowAliasModal(true);
          }}
        />
      )}

      {showStockSetupModal && (
        <ProductStockSetupModal
          onClose={() => setShowStockSetupModal(false)}
          onUpdated={() => { cloudSyncService.broadcastProductsUpdate('ADMIN'); loadData(); }}
        />
      )}

      {/* 사진 크게 보기 */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px] flex items-center justify-center p-5"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div
            className="bg-surface rounded-2xl max-w-sm w-full overflow-hidden shadow-xl animate-settle"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 h-14 flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 text-sm text-ink-soft">
                <ImageIcon className="w-4 h-4 text-ink-faint" />
                촬영한 사진
              </span>
              <button
                type="button"
                onClick={() => setPreviewPhotoUrl(null)}
                aria-label="닫기"
                className="w-9 h-9 -mr-2 rounded-full text-ink-faint hover:text-ink hover:bg-sunken flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={previewPhotoUrl}
              alt="촬영한 상품 사진"
              className="w-full max-h-96 object-contain bg-sunken"
            />
          </div>
        </div>
      )}
          
      {/* Worker Modal */}
      {showWorkerModal && (
        <div className="fixed inset-0 bg-ink/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-500" />
                근무자 관리 (전화번호 뒷자리)
              </h3>
              <button onClick={() => setShowWorkerModal(false)} className="p-2 hover:bg-sunken rounded-xl text-ink-faint">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="이름 (예: 김알바)"
                className="flex-1 min-w-0 h-12 px-4 rounded-xl border border-line bg-sunken focus:bg-white transition-colors"
                value={newWorkerName}
                onChange={e => setNewWorkerName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newWorkerName && newWorkerId.length === 4) {
                    e.preventDefault();
                    addWorker();
                  }
                }}
              />
              <input
                type="text"
                inputMode="numeric"
                placeholder="번호 4자리"
                maxLength={4}
                className="w-28 shrink-0 h-12 px-4 rounded-xl border border-line bg-sunken focus:bg-white text-center font-mono transition-colors"
                value={newWorkerId}
                onChange={e => {
                  const cleaned = e.target.value.replace(/[^0-9]/g, '');
                  setNewWorkerId(cleaned.length > 4 ? cleaned.slice(-4) : cleaned);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newWorkerName && newWorkerId.length === 4) {
                    e.preventDefault();
                    addWorker();
                  }
                }}
              />
              <button
                onClick={addWorker}
                disabled={!newWorkerName || newWorkerId.length < 4}
                className="px-4 h-12 bg-blue-500 text-white rounded-xl font-bold disabled:opacity-50 shrink-0"
              >
                추가
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[200px]">
              {workers.length === 0 ? (
                <div className="h-full flex items-center justify-center text-ink-faint">
                  등록된 근무자가 없습니다
                </div>
              ) : (
                <ul className="space-y-2">
                  {workers.map(w => (
                    <li key={w.id} className="flex items-center justify-between p-4 bg-sunken rounded-xl">
                      <div>
                        <p className="font-bold">{w.name}</p>
                        <p className="text-sm text-ink-soft mt-1">전화번호 뒷자리: {w.id}</p>
                      </div>
                      <button
                        onClick={() => removeWorker(w.id)}
                        className="p-2 text-clay hover:bg-white rounded-lg transition-colors"
                      >
                        삭제
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <RestoreAuditModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onRestored={(count, sourceName) => {
          const updated = storageService.getAudits();
          setAudits(updated);
          cloudSyncService.broadcastAudits(updated, 'ADMIN');
          loadData();
          alert(`🎉 총 ${count}건 (${sourceName})이 실사 목록으로 성공적으로 복구되었습니다!`);
        }}
      />
        </>
      )}
</div>
  );
};
