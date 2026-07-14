"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import NextImage from "next/image";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

const COLOR_HEX: Record<string, string> = {
  black: "#000000", white: "#FFFFFF", navy: "#1E3A5F", red: "#DC2626",
  forest: "#166534", "heather grey": "#9CA3AF", "heather gray": "#9CA3AF",
  sand: "#D4A574", pink: "#EC4899", royal: "#2563EB", charcoal: "#374151",
  "dark heather": "#4B5563", "athletic heather": "#9CA3AF",
  "military green": "#4D7C0F", "carolina blue": "#60A5FA",
  "light blue": "#93C5FD", "light pink": "#FBCFE8", "light gray": "#D1D5DB",
  gold: "#F59E0B", purple: "#7C3AED", orange: "#F97316", brown: "#92400E",
  burgundy: "#7F1D1D", coral: "#F87171", mint: "#6EE7B7", olive: "#65A30D",
  tan: "#D4A574", cream: "#FEF3C7", gray: "#9CA3AF", grey: "#9CA3AF",
  "true royal": "#2563EB", asphalt: "#4B5563", "sage green": "#86EFAC",
  "dusty blue": "#93C5FD", "blush": "#FECDD3",
};

function getColorHex(name: string): string {
  return COLOR_HEX[name.toLowerCase()] || "#9CA3AF";
}

const FONTS = [
  "Arial", "Impact", "Georgia", "Courier New", "Verdana",
  "Times New Roman", "Comic Sans MS", "Trebuchet MS",
];

const DESIGN_CATEGORIES = [
  { name: "Apparel", icon: "👕", desc: "T-shirts, hoodies, sweatshirts" },
  { name: "Drinkware", icon: "☕", desc: "Mugs, tumblers, bottles" },
  { name: "Wall Art", icon: "🖼", desc: "Posters, canvases, prints" },
  { name: "Electronics", icon: "📱", desc: "Phone cases, laptop sleeves" },
  { name: "Bags", icon: "👜", desc: "Tote bags, backpacks" },
  { name: "Headwear", icon: "🧢", desc: "Caps, beanies, visors" },
  { name: "Accessories", icon: "🧦", desc: "Socks, leggings, joggers" },
  { name: "Home", icon: "🏠", desc: "Pillows, blankets, throws" },
  { name: "Stickers", icon: "🏷", desc: "Stickers, labels, decals" },
  { name: "Stationery", icon: "📓", desc: "Journals, notebooks" },
  { name: "Footwear", icon: "👟", desc: "Shoes, slides, slippers" },
];

export default function DesignerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full"></div></div>}>
      <DesignerPageInner />
    </Suspense>
  );
}

function DesignerPageInner() {
  const { addItem } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, loading: authLoading } = useAuth();

  const preselectedBlueprint = searchParams.get("blueprint");
  const preselectedProvider = searchParams.get("provider");

  const [step, setStep] = useState(preselectedBlueprint ? 2 : 1);

  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [browseCategory, setBrowseCategory] = useState("");
  const [browseItems, setBrowseItems] = useState<any[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browsePage, setBrowsePage] = useState(1);
  const [browseTotal, setBrowseTotal] = useState(0);

  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>(preselectedProvider || "");
  const [variants, setVariants] = useState<any>(null);

  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

  const [designFile, setDesignFile] = useState<File | null>(null);
  const [designPreview, setDesignPreview] = useState<string | null>(null);
  const [designUrl, setDesignUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [designScale, setDesignScale] = useState(70);
  const [designOffset, setDesignOffset] = useState({ x: 0, y: 0 });
  const [designRotation, setDesignRotation] = useState(0);
  const [removeBg, setRemoveBg] = useState(false);
  const [printArea, setPrintArea] = useState<{ width: number; height: number; position: string } | null>(null);
  const [activePrintArea, setActivePrintArea] = useState<"front" | "back">("front");
  const [frontDesign, setFrontDesign] = useState<string | null>(null);
  const [backDesign, setBackDesign] = useState<string | null>(null);

  const [isDraggingDesign, setIsDraggingDesign] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showSnapGuides, setShowSnapGuides] = useState(false);
  const [snapAxis, setSnapAxis] = useState<{ x: boolean; y: boolean }>({ x: false, y: false });
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, scale: 70 });

  const [textOverlays, setTextOverlays] = useState<Array<{
    id: number; text: string; font: string; color: string; size: number; x: number; y: number;
  }>>([]);
  const [showTextPanel, setShowTextPanel] = useState(false);
  const [newText, setNewText] = useState("");
  const [newTextFont, setNewTextFont] = useState("Arial");
  const [newTextColor, setNewTextColor] = useState("#000000");
  const [newTextSize, setNewTextSize] = useState(24);
  const [draggingTextId, setDraggingTextId] = useState<number | null>(null);
  const textDragStart = useRef({ x: 0, y: 0, origX: 0, origY: 0 });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [retailPrice, setRetailPrice] = useState("29.99");
  const [tags, setTags] = useState("");
  const [creating, setCreating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savingDesign, setSavingDesign] = useState(false);

  const [previewColor, setPreviewColor] = useState<string>("");
  const [showColorPreview, setShowColorPreview] = useState(false);
  const [processedDesignUrl, setProcessedDesignUrl] = useState<string | null>(null);

  const processBackgroundRemoval = (imgSrc: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const threshold = 230;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          if (r > threshold && g > threshold && b > threshold) {
            data[i + 3] = 0;
          } else if (r > 210 && g > 210 && b > 210) {
            const avg = (r + g + b) / 3;
            data[i + 3] = Math.round(((255 - avg) / (255 - threshold)) * 255);
          }
        }
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve(imgSrc);
      img.src = imgSrc;
    });
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (removeBg && (frontDesign || backDesign || designPreview)) {
      const src = activePrintArea === "front" ? (frontDesign || designPreview) : (backDesign || designPreview);
      if (src) processBackgroundRemoval(src).then(setProcessedDesignUrl);
    } else {
      setProcessedDesignUrl(null);
    }
  }, [removeBg, frontDesign, backDesign, designPreview, activePrintArea]);

  useEffect(() => {
    if (preselectedBlueprint) {
      api.get<any>(`/api/catalog/${preselectedBlueprint}`).then((p) => {
        setSelectedProduct(p);
        setTitle(p.title);
        loadProviders(Number(preselectedBlueprint));
      }).catch(() => toast.error("Failed to load product"));
    }
  }, [preselectedBlueprint]);

  const searchCatalog = async (q: string) => {
    if (q.length < 2) { setCatalogItems([]); return; }
    setCatalogLoading(true);
    try {
      const res = await api.get<any>(`/api/catalog?search=${encodeURIComponent(q)}&per_page=12`);
      setCatalogItems(res.items || []);
    } catch {} finally { setCatalogLoading(false); }
  };

  const browseCatalogCategory = async (cat: string, page: number = 1) => {
    setBrowseLoading(true);
    setBrowseCategory(cat);
    setBrowsePage(page);
    try {
      const res = await api.get<any>(`/api/catalog?category=${encodeURIComponent(cat)}&per_page=12&page=${page}`);
      setBrowseItems(res.items || []);
      setBrowseTotal(res.total || 0);
    } catch {} finally { setBrowseLoading(false); }
  };

  const loadProviders = async (blueprintId: number) => {
    try {
      const res = await api.get<any[]>(`/api/printify/catalog/blueprints/${blueprintId}/providers`);
      setProviders(Array.isArray(res) ? res : []);
    } catch { toast.error("Failed to load providers"); }
  };

  const loadVariants = async (blueprintId: number, providerId: number) => {
    try {
      const res = await api.get<any>(`/api/printify/catalog/blueprints/${blueprintId}/providers/${providerId}/variants`);
      setVariants(res);
      setSelectedProviderId(String(providerId));
      setSelectedColor("");
      setSelectedSize("");
      setSelectedVariantId(null);

      const allVariants = res?.variants || [];
      const colorSet = new Set<string>();
      const sizeSet = new Set<string>();
      allVariants.forEach((v: any) => {
        if (v.options?.color) colorSet.add(v.options.color);
        if (v.options?.size) sizeSet.add(v.options.size);
      });
      const colors = Array.from(colorSet);
      const sizes = Array.from(sizeSet);
      setAvailableColors(colors);
      setAvailableSizes(sizes);
      if (colors.length === 1) setSelectedColor(colors[0]);
      if (sizes.length === 1) setSelectedSize(sizes[0]);

      const firstVariant = allVariants[0];
      const frontPlaceholder = firstVariant?.placeholders?.find((p: any) => p.position === "front") || firstVariant?.placeholders?.[0];
      if (frontPlaceholder) {
        setPrintArea({ width: frontPlaceholder.width, height: frontPlaceholder.height, position: frontPlaceholder.position });
      } else {
        setPrintArea(null);
      }
    } catch { toast.error("Failed to load variants"); }
  };

  useEffect(() => {
    if (!selectedProviderId || !variants?.variants || !selectedProduct) return;
    if (selectedColor && selectedSize) {
      const match = variants.variants.find((v: any) => v.options?.color === selectedColor && v.options?.size === selectedSize);
      if (match) setSelectedVariantId(match.id);
    } else if (selectedColor && availableSizes.length === 0) {
      const match = variants.variants.find((v: any) => v.options?.color === selectedColor);
      if (match) setSelectedVariantId(match.id);
    } else if (selectedSize && availableColors.length === 0) {
      const match = variants.variants.find((v: any) => v.options?.size === selectedSize);
      if (match) setSelectedVariantId(match.id);
    }
  }, [selectedColor, selectedSize, variants, selectedProviderId]);

  const selectProduct = (item: any) => {
    setSelectedProduct(item);
    setTitle(item.title);
    setCatalogItems([]);
    setBrowseItems([]);
    setCatalogSearch("");
    setBrowseCategory("");
    loadProviders(item.id);
    setStep(2);
  };

  const handleFileSelect = useCallback((file: File) => {
    setDesignFile(file);
    setDesignScale(70);
    setDesignOffset({ x: 0, y: 0 });
    setDesignRotation(0);
    setRemoveBg(false);
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      setDesignPreview(preview);
      if (activePrintArea === "front") setFrontDesign(preview);
      else setBackDesign(preview);
    };
    reader.readAsDataURL(file);
  }, [activePrintArea]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDesignDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingDesign(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = { x: clientX, y: clientY, offsetX: designOffset.x, offsetY: designOffset.y };
  }, [designOffset]);

  useEffect(() => {
    if (!isDraggingDesign) return;
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const dx = clientX - dragStartRef.current.x;
      const dy = clientY - dragStartRef.current.y;
      let newX = dragStartRef.current.offsetX + dx;
      let newY = dragStartRef.current.offsetY + dy;

      const snapThreshold = 8;
      let snappedX = false, snappedY = false;
      if (Math.abs(newX) < snapThreshold) { newX = 0; snappedX = true; }
      if (Math.abs(newY) < snapThreshold) { newY = 0; snappedY = true; }
      setSnapAxis({ x: snappedX, y: snappedY });
      setShowSnapGuides(snappedX || snappedY);
      setDesignOffset({ x: newX, y: newY });
    };
    const handleUp = () => { setIsDraggingDesign(false); setShowSnapGuides(false); setSnapAxis({ x: false, y: false }); };
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    document.addEventListener("touchmove", handleMove, { passive: false });
    document.addEventListener("touchend", handleUp);
    return () => { document.removeEventListener("mousemove", handleMove); document.removeEventListener("mouseup", handleUp); document.removeEventListener("touchmove", handleMove); document.removeEventListener("touchend", handleUp); };
  }, [isDraggingDesign]);

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    resizeStartRef.current = { x: clientX, y: 0, scale: designScale };
  }, [designScale]);

  useEffect(() => {
    if (!isResizing) return;
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const dx = clientX - resizeStartRef.current.x;
      const containerWidth = canvasRef.current?.getBoundingClientRect().width || 400;
      const deltaPercent = (dx / containerWidth) * 100;
      setDesignScale(Math.min(100, Math.max(5, Math.round(resizeStartRef.current.scale + deltaPercent))));
    };
    const handleUp = () => setIsResizing(false);
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    document.addEventListener("touchmove", handleMove, { passive: false });
    document.addEventListener("touchend", handleUp);
    return () => { document.removeEventListener("mousemove", handleMove); document.removeEventListener("mouseup", handleUp); document.removeEventListener("touchmove", handleMove); document.removeEventListener("touchend", handleUp); };
  }, [isResizing]);

  const handleTextDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, id: number) => {
    e.preventDefault();
    const textItem = textOverlays.find((t) => t.id === id);
    if (!textItem) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setDraggingTextId(id);
    textDragStart.current = { x: clientX, y: clientY, origX: textItem.x, origY: textItem.y };
  }, [textOverlays]);

  useEffect(() => {
    if (draggingTextId === null) return;
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const dx = clientX - textDragStart.current.x;
      const dy = clientY - textDragStart.current.y;
      setTextOverlays((prev) => prev.map((t) => t.id === draggingTextId ? { ...t, x: textDragStart.current.origX + dx, y: textDragStart.current.origY + dy } : t));
    };
    const handleUp = () => setDraggingTextId(null);
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    document.addEventListener("touchmove", handleMove, { passive: false });
    document.addEventListener("touchend", handleUp);
    return () => { document.removeEventListener("mousemove", handleMove); document.removeEventListener("mouseup", handleUp); document.removeEventListener("touchmove", handleMove); document.removeEventListener("touchend", handleUp); };
  }, [draggingTextId]);

  const uploadDesign = async () => {
    if (!designFile) return;
    setUploading(true);
    try {
      const result = await api.upload("/api/uploads/design", designFile);
      setDesignUrl(result.url);
      toast.success("Design uploaded!");
    } catch (err: any) { toast.error(err.message || "Upload failed"); }
    finally { setUploading(false); }
  };

  const createProduct = async () => {
    if (!selectedProduct || !title || !designUrl || !selectedProviderId) {
      toast.error("Complete all steps first");
      return;
    }
    setCreating(true);
    try {
      const baseCost = parseFloat(retailPrice) * 0.4;
      const product = await api.post<any>("/api/products", {
        title, description, base_cost: baseCost,
        retail_price: parseFloat(retailPrice),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      toast.success("Product created! ID: " + product.id);
      router.push("/dashboard");
    } catch (err: any) { toast.error(err.message || "Failed"); }
    finally { setCreating(false); }
  };

  const publishToPrintify = async () => {
    if (!selectedProduct || !title || !selectedProviderId) {
      toast.error("Complete all steps first");
      return;
    }
    const allVariants: any[] = variants?.variants || [];
    const sizeVariants = allVariants.filter((v: any) => v.options?.size === selectedSize);
    const variantIds = sizeVariants.length > 0 ? sizeVariants.map((v: any) => v.id) : allVariants.slice(0, 5).map((v: any) => v.id);
    if (variantIds.length === 0) { toast.error("No variants available"); return; }
    setPublishing(true);
    try {
      const result = await api.post<any>("/api/printify/publish-from-designer", {
        title, description,
        blueprint_id: selectedProduct.id,
        print_provider_id: Number(selectedProviderId),
        image_url: designUrl || selectedProduct.images?.[0] || "",
        variant_ids: variantIds,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        publish_immediately: false,
      });
      toast.success("Published to Printify! Product ID: " + result.id);
      router.push("/printify/products");
    } catch (err: any) { toast.error(err.message || "Failed to publish"); }
    finally { setPublishing(false); }
  };

  const addDesignToCart = () => {
    if (!selectedProduct || !selectedProviderId) {
      toast.error("Select a product and provider first");
      return;
    }
    const providerObj = providers.find((p) => String(p.id) === selectedProviderId);
    let matchedVariant = variants?.variants?.[0];
    if (selectedVariantId) {
      matchedVariant = variants?.variants?.find((v: any) => v.id === selectedVariantId) || matchedVariant;
    }
    addItem({
      id: Date.now(),
      blueprintId: selectedProduct.id,
      title: title || selectedProduct.title,
      image: selectedProduct.images?.[0] || "",
      provider: { id: Number(selectedProviderId), name: providerObj?.title || providerObj?.name || "" },
      variant: {
        id: matchedVariant?.id || 0,
        title: matchedVariant?.title || "",
        options: matchedVariant?.options || {},
      },
      price: parseFloat(retailPrice),
      quantity: 1,
      designFileUrl: designUrl || "",
    });
    toast.success("Added to cart!");
  };

  const saveDesign = async () => {
    if (!selectedProduct || !designUrl) {
      toast.error("Upload a design first");
      return;
    }
    setSavingDesign(true);
    try {
      await api.post("/api/designs", {
        title: title || selectedProduct.title,
        blueprint_id: selectedProduct.id,
        provider_id: Number(selectedProviderId),
        variant_id: selectedVariantId,
        design_url: designUrl,
        front_design_url: frontDesign || undefined,
        back_design_url: backDesign || undefined,
        color: selectedColor || undefined,
        size: selectedSize || undefined,
        design_config: {
          scale: designScale,
          offset: designOffset,
          rotation: designRotation,
          removeBg,
          textOverlays,
          printArea,
        },
      });
      toast.success("Design saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save design");
    } finally {
      setSavingDesign(false);
    }
  };

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" /></div>;

  const STEPS = ["Product", "Design", "Options", "Details", "Price"];
  const activeDesign = activePrintArea === "front" ? (frontDesign || designPreview) : (backDesign || designPreview);
  const activeDesignForUpload = activePrintArea === "front" ? frontDesign : backDesign;

  const allVariants: any[] = variants?.variants || [];
  const currentVariant = allVariants.find((v: any) => v.id === selectedVariantId);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => step > 1 ? setStep(step - 1) : router.back()} className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            {step > 1 ? "Back" : "Exit"}
          </button>
          <span className="font-semibold text-gray-900">Product Designer</span>
          <Link href="/printify/catalog" className="text-sm text-brand-600 hover:text-brand-700 font-medium">Browse Catalog</Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => i + 1 < step && setStep(i + 1)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition ${
                  step >= i + 1 ? "bg-brand-600 text-white" : "bg-gray-200 text-gray-500"
                } ${i + 1 < step ? "cursor-pointer hover:bg-brand-700" : ""}`}
              >
                {i + 1 < step ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : i + 1}
              </button>
              <span className={`text-sm hidden md:inline ${step >= i + 1 ? "text-gray-900 font-medium" : "text-gray-400"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`w-8 h-0.5 ${step > i + 1 ? "bg-brand-600" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose a product</h2>
            <p className="text-gray-500 mb-6">Browse by category or search from 1,691 products</p>

            {!browseCategory && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Categories</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {DESIGN_CATEGORIES.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => browseCatalogCategory(cat.name)}
                      className="bg-white rounded-xl border border-gray-100 p-4 text-left hover:shadow-lg hover:border-brand-300 transition group"
                    >
                      <div className="text-3xl mb-2">{cat.icon}</div>
                      <div className="font-medium text-gray-900 text-sm group-hover:text-brand-600 transition">{cat.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{cat.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="relative mb-6">
              <div className="flex gap-3">
                {browseCategory && (
                  <button onClick={() => { setBrowseCategory(""); setBrowseItems([]); }} className="px-3 py-2 bg-brand-50 text-brand-700 text-sm font-medium rounded-lg hover:bg-brand-100 transition flex-shrink-0 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    {browseCategory}
                  </button>
                )}
                <div className="relative flex-1">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => { setCatalogSearch(e.target.value); searchCatalog(e.target.value); }}
                    placeholder="Search products... (e.g. hoodie, mug, poster)"
                    className="w-full rounded-xl border-gray-200 pl-12 pr-4 py-3.5 text-lg border focus:border-brand-500 focus:ring-brand-500 shadow-sm"
                    autoFocus
                  />
                  {catalogLoading && <div className="absolute right-4 top-1/2 -translate-y-1/2"><div className="animate-spin w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full" /></div>}
                </div>
              </div>
            </div>

            {browseCategory && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{browseCategory} <span className="text-gray-400 font-normal">({browseTotal.toLocaleString()} products)</span></h3>
                </div>
                {browseLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
                        <div className="aspect-square bg-gray-100" />
                        <div className="p-3"><div className="h-3 bg-gray-100 rounded w-3/4 mb-2" /><div className="h-2 bg-gray-100 rounded w-1/2" /></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {browseItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => selectProduct(item)}
                        className="bg-white rounded-xl border border-gray-100 overflow-hidden text-left hover:shadow-lg hover:border-brand-300 transition group"
                      >
                        <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                          {item.images?.[0] ? (
                            <NextImage src={item.images[0]} alt={item.title} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition" />
                          ) : <div className="text-4xl text-gray-200">👕</div>}
                        </div>
                        <div className="p-3">
                          <div className="font-medium text-gray-900 text-sm line-clamp-2">{item.title}</div>
                          {item.brand && <div className="text-xs text-gray-500 mt-0.5">{item.brand}</div>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {browseTotal > 12 && (
                  <div className="mt-4 flex justify-center gap-2">
                    <button onClick={() => browseCatalogCategory(browseCategory, Math.max(1, browsePage - 1))} disabled={browsePage === 1} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50">Previous</button>
                    <span className="px-4 py-2 text-sm text-gray-500">Page {browsePage}</span>
                    <button onClick={() => browseCatalogCategory(browseCategory, browsePage + 1)} disabled={browseItems.length < 12} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50">Next</button>
                  </div>
                )}
              </div>
            )}

            {catalogItems.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {catalogItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => selectProduct(item)}
                    className="bg-white rounded-xl border border-gray-100 overflow-hidden text-left hover:shadow-lg hover:border-brand-300 transition group"
                  >
                    <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                      {item.images?.[0] ? (
                        <NextImage src={item.images[0]} alt={item.title} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition" />
                      ) : <div className="text-4xl text-gray-200">👕</div>}
                    </div>
                    <div className="p-3">
                      <div className="font-medium text-gray-900 text-sm line-clamp-2">{item.title}</div>
                      {item.brand && <div className="text-xs text-gray-500 mt-0.5">{item.brand}</div>}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {catalogSearch.length >= 2 && catalogItems.length === 0 && !catalogLoading && !browseCategory && (
              <div className="text-center py-12 text-gray-400">No products match your search.</div>
            )}
            {!catalogSearch && !browseCategory && browseItems.length === 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Popular Products</h3>
                <PopularProducts onSelect={selectProduct} />
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload your design</h2>
              {selectedProduct && (
                <div className="flex items-center gap-3 mb-4 p-3 bg-white rounded-lg border border-gray-100">
                  {selectedProduct.images?.[0] && <NextImage src={selectedProduct.images[0]} alt="" width={48} height={48} className="w-12 h-12 rounded-lg object-cover" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">{selectedProduct.title}</div>
                    <div className="text-xs text-gray-500">{selectedProduct.brand}</div>
                  </div>
                  <button onClick={() => { setStep(1); setSelectedProduct(null); }} className="text-xs text-brand-600 hover:underline flex-shrink-0">Change</button>
                </div>
              )}

              {allVariants.length > 0 && availableColors.length > 0 && (
                <div className="mb-4 p-3 bg-white rounded-lg border border-gray-100">
                  <div className="text-xs font-medium text-gray-500 mb-2">Preview on color</div>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((c) => (
                      <button
                        key={c}
                        onClick={() => { setPreviewColor(c); setShowColorPreview(true); }}
                        className={`w-7 h-7 rounded-full border-2 transition ${previewColor === c && showColorPreview ? "border-brand-600 scale-110" : "border-gray-200 hover:border-gray-400"}`}
                        style={{ backgroundColor: getColorHex(c) }}
                        title={c}
                      />
                    ))}
                    {showColorPreview && (
                      <button onClick={() => { setShowColorPreview(false); setPreviewColor(""); }} className="text-xs text-gray-500 hover:text-gray-700 underline ml-1">Reset</button>
                    )}
                  </div>
                </div>
              )}

              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => !activeDesign && fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-brand-400 transition bg-white"
              >
                <input ref={fileInputRef} type="file" accept="image/*,.svg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
                {activeDesign ? (
                  <img src={activeDesign} alt="Design" className="max-h-48 max-w-full mx-auto object-contain" />
                ) : (
                  <>
                    <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <p className="text-gray-700 font-medium">Drag & drop your design</p>
                    <p className="text-sm text-gray-400 mt-1">PNG, JPG, SVG up to 50MB</p>
                  </>
                )}
              </div>

              {activeDesign && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
                    Replace
                  </button>
                  {activePrintArea === "front" && backDesign && (
                    <button onClick={() => setActivePrintArea("back")} className="flex-1 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
                      Design Back
                    </button>
                  )}
                  {activePrintArea === "back" && frontDesign && (
                    <button onClick={() => setActivePrintArea("front")} className="flex-1 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
                      Design Front
                    </button>
                  )}
                </div>
              )}

              {designFile && !designUrl && (
                <button onClick={uploadDesign} disabled={uploading} className="mt-3 w-full py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 transition">
                  {uploading ? "Uploading..." : "Upload Design"}
                </button>
              )}
              {designUrl && <div className="mt-3 p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Design uploaded successfully
              </div>}

              <button onClick={() => setShowTextPanel(!showTextPanel)} className="mt-3 w-full py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Add Text
              </button>

              {showTextPanel && (
                <div className="mt-3 p-4 bg-white rounded-lg border border-gray-100 space-y-3">
                  <input type="text" value={newText} onChange={(e) => setNewText(e.target.value)} placeholder="Enter text..." className="w-full rounded-lg border-gray-200 px-3 py-2 text-sm border focus:border-brand-500 focus:ring-brand-500" />
                  <div className="grid grid-cols-2 gap-3">
                    <select value={newTextFont} onChange={(e) => setNewTextFont(e.target.value)} className="rounded-lg border-gray-200 px-3 py-2 text-sm border focus:border-brand-500 focus:ring-brand-500">
                      {FONTS.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                    </select>
                    <input type="number" min={8} max={120} value={newTextSize} onChange={(e) => setNewTextSize(Number(e.target.value))} className="rounded-lg border-gray-200 px-3 py-2 text-sm border focus:border-brand-500 focus:ring-brand-500" placeholder="Size" />
                  </div>
                  <div className="flex gap-3 items-center">
                    <input type="color" value={newTextColor} onChange={(e) => setNewTextColor(e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                    <span className="text-xs text-gray-500">Text color</span>
                  </div>
                  <button onClick={() => {
                    if (!newText.trim()) return;
                    setTextOverlays((prev) => [...prev, { id: Date.now(), text: newText, font: newTextFont, color: newTextColor, size: newTextSize, x: 0, y: 0 }]);
                    setNewText("");
                    setShowTextPanel(false);
                    toast.success("Text added! Drag to position.");
                  }} className="w-full py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition">
                    Add Text
                  </button>
                </div>
              )}

              {textOverlays.length > 0 && (
                <div className="mt-3 space-y-1">
                  {textOverlays.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
                      <span className="flex-1 text-sm truncate" style={{ fontFamily: t.font, color: t.color }}>"{t.text}"</span>
                      <button onClick={() => setTextOverlays((prev) => prev.filter((x) => x.id !== t.id))} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Live Preview</h3>

              {allVariants.length > 0 && availableColors.length > 1 && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  {availableColors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setPreviewColor(c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                        previewColor === c ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <span className="inline-block w-3 h-3 rounded-full mr-1.5 border border-gray-200" style={{ backgroundColor: getColorHex(c) }} />
                      {c}
                    </button>
                  ))}
                </div>
              )}

              <div
                ref={canvasRef}
                className="rounded-xl aspect-square flex items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: previewColor ? getColorHex(previewColor) : "#E5E7EB" }}
              >
                {selectedProduct?.images?.[0] ? (
                  <div className="relative w-full h-full">
                    <NextImage src={selectedProduct.images[0]} alt="Product" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-contain" />

                    {showSnapGuides && (
                      <>
                        {snapAxis.x && <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-brand-500 z-30 pointer-events-none" style={{ opacity: 0.7 }} />}
                        {snapAxis.y && <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-brand-500 z-30 pointer-events-none" style={{ opacity: 0.7 }} />}
                      </>
                    )}

                    {activeDesign && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div
                          className="relative flex items-center justify-center pointer-events-auto"
                          style={{
                            width: printArea ? `${(printArea.width / Math.max(printArea.width, printArea.height)) * designScale}%` : `${designScale}%`,
                            height: printArea ? `${(printArea.height / Math.max(printArea.width, printArea.height)) * designScale}%` : `${designScale}%`,
                            maxWidth: "85%",
                            maxHeight: "85%",
                            transform: `translate(${designOffset.x}px, ${designOffset.y}px) rotate(${designRotation}deg)`,
                            cursor: isDraggingDesign ? "grabbing" : "grab",
                          }}
                          onMouseDown={handleDesignDragStart}
                          onTouchStart={handleDesignDragStart}
                        >
                          <img
                            src={processedDesignUrl || activeDesign}
                            alt="Design overlay"
                            className={`w-full h-full object-contain select-none ${removeBg ? "" : "drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]"}`}
                            style={{ pointerEvents: "none" }}
                            draggable={false}
                          />
                          <div onMouseDown={handleResizeStart} onTouchStart={handleResizeStart} className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-white border-2 border-brand-500 rounded-full cursor-nwse-hover opacity-80 hover:opacity-100 transition shadow-sm" />
                          <div onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); resizeStartRef.current = { x: e.clientX, y: e.clientY, scale: designScale }; }} onTouchStart={(e) => { e.preventDefault(); setIsResizing(true); resizeStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, scale: designScale }; }} className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-white border-2 border-brand-500 rounded-full cursor-nwse-hover opacity-80 hover:opacity-100 transition shadow-sm" />
                        </div>
                      </div>
                    )}

                    {textOverlays.map((t) => (
                      <div
                        key={t.id}
                        className="absolute pointer-events-auto select-none"
                        style={{
                          left: `calc(50% + ${t.x}px)`,
                          top: `calc(50% + ${t.y}px)`,
                          transform: "translate(-50%, -50%)",
                          fontFamily: t.font,
                          fontSize: `${Math.max(10, t.size * 0.8)}px`,
                          color: t.color,
                          fontWeight: "bold",
                          textShadow: "0 1px 4px rgba(0,0,0,0.3)",
                          cursor: draggingTextId === t.id ? "grabbing" : "grab",
                          whiteSpace: "nowrap",
                        }}
                        onMouseDown={(e) => handleTextDragStart(e, t.id)}
                        onTouchStart={(e) => handleTextDragStart(e, t.id)}
                      >
                        {t.text}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400">Preview</div>
                )}
              </div>

              {activeDesign && (
                <div className="mt-3 bg-white rounded-lg border border-gray-100 p-4 space-y-4">
                  <div className="flex gap-1">
                    <button onClick={() => setActivePrintArea("front")} className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${activePrintArea === "front" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                      Front
                    </button>
                    <button onClick={() => { if (!backDesign && !designUrl) { toast.error("Upload a design first, then switch to back"); return; } setActivePrintArea("back"); }} className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${activePrintArea === "back" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                      Back
                    </button>
                    {backDesign && <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full" />}
                  </div>

                  {printArea && (
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                      <span className="font-medium text-gray-700">Print area:</span>
                      <span>{printArea.width} × {printArea.height}px</span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-gray-500">Size</label>
                      <span className="text-xs font-medium text-gray-700">{designScale}%</span>
                    </div>
                    <input type="range" min={5} max={100} value={designScale} onChange={(e) => setDesignScale(Number(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-brand-600" />
                    <p className="text-[10px] text-gray-400 mt-1">Drag design on preview or use slider</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-gray-500">Rotation</label>
                      <span className="text-xs font-medium text-gray-700">{designRotation}°</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setDesignRotation((r) => r - 15)} className="px-2 py-1 border border-gray-200 rounded text-xs hover:bg-gray-50">-15°</button>
                      <input type="range" min={-180} max={180} value={designRotation} onChange={(e) => setDesignRotation(Number(e.target.value))} className="flex-1 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-brand-600" />
                      <button onClick={() => setDesignRotation((r) => r + 15)} className="px-2 py-1 border border-gray-200 rounded text-xs hover:bg-gray-50">+15°</button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1.5">Position</label>
                    <div className="grid grid-cols-3 gap-1 max-w-[180px]">
                      <div />
                      <button onClick={() => setDesignOffset((p) => ({ ...p, y: p.y - 8 }))} className="py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm transition" title="Move up">↑</button>
                      <div />
                      <button onClick={() => setDesignOffset((p) => ({ ...p, x: p.x - 8 }))} className="py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm transition" title="Move left">←</button>
                      <button onClick={() => { setDesignOffset({ x: 0, y: 0 }); setDesignRotation(0); }} className="py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-[10px] font-medium transition" title="Reset">Reset</button>
                      <button onClick={() => setDesignOffset((p) => ({ ...p, x: p.x + 8 }))} className="py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm transition" title="Move right">→</button>
                      <div />
                      <button onClick={() => setDesignOffset((p) => ({ ...p, y: p.y + 8 }))} className="py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm transition" title="Move down">↓</button>
                      <div />
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2 border-t border-gray-100">
                    <div>
                      <div className="text-xs font-medium text-gray-700">Remove background</div>
                      <div className="text-[10px] text-gray-400">Best for white bg on dark products</div>
                    </div>
                    <button onClick={() => setRemoveBg(!removeBg)} className={`relative w-10 h-5 rounded-full transition-colors ${removeBg ? "bg-brand-600" : "bg-gray-300"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${removeBg ? "left-[22px]" : "left-0.5"}`} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Select options</h2>
            <p className="text-gray-500 mb-6">Choose colors and sizes for your product</p>

            <div className="space-y-6">
              {providers.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Print Provider</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {providers.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { if (selectedProduct) loadVariants(selectedProduct.id, p.id); }}
                        className={`p-3 rounded-lg border-2 text-left transition ${
                          String(p.id) === selectedProviderId ? "border-brand-600 bg-brand-50" : "border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <div className="font-medium text-gray-900 text-sm">{p.title || p.name}</div>
                        {p.location && <div className="text-xs text-gray-500 mt-0.5">{p.location}</div>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {availableColors.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Color</label>
                  <div className="flex flex-wrap gap-3">
                    {availableColors.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition ${
                          selectedColor === c ? "border-brand-600 bg-brand-50" : "border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <span className="w-6 h-6 rounded-full border border-gray-200 shadow-inner" style={{ backgroundColor: getColorHex(c) }} />
                        <span className="text-sm font-medium text-gray-900">{c}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {availableSizes.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Size</label>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((s) => {
                      const inStock = allVariants.some((v: any) => v.options?.color === (selectedColor || allVariants[0]?.options?.color) && v.options?.size === s);
                      return (
                        <button
                          key={s}
                          onClick={() => setSelectedSize(s)}
                          disabled={!inStock}
                          className={`w-14 h-14 rounded-lg border-2 text-sm font-medium transition ${
                            selectedSize === s ? "border-brand-600 bg-brand-50 text-brand-700" :
                            inStock ? "border-gray-100 text-gray-700 hover:border-gray-200" : "border-gray-100 text-gray-300 cursor-not-allowed line-through"
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedVariantId && currentVariant && (
                <div className="bg-green-50 rounded-xl border border-green-100 p-4 flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <div>
                    <div className="text-sm font-medium text-green-800">{currentVariant.title}</div>
                    <div className="text-xs text-green-600">Base cost: ${(currentVariant.price / 100).toFixed(2)}</div>
                  </div>
                </div>
              )}

              {selectedProviderId && availableColors.length === 0 && availableSizes.length === 0 && (
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-6 text-center text-gray-500 text-sm">
                  No color/size options available for this provider.
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Product details</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border-gray-300 px-4 py-2.5 border focus:border-brand-500 focus:ring-brand-500" placeholder="Give your product a name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full rounded-lg border-gray-300 px-4 py-2.5 border focus:border-brand-500 focus:ring-brand-500" placeholder="Describe your product..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma separated)</label>
                <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full rounded-lg border-gray-300 px-4 py-2.5 border focus:border-brand-500 focus:ring-brand-500" placeholder="streetwear, graphic, vintage" />
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Set your price</h2>
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Base cost (T-Shirt Central 365 fee)</span>
                  <span className="font-medium text-gray-900">${(parseFloat(retailPrice) * 0.4).toFixed(2)}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Retail price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input type="number" step="0.01" min="0" value={retailPrice} onChange={(e) => setRetailPrice(e.target.value)} className="w-full rounded-lg border-gray-300 pl-8 pr-4 py-2.5 border focus:border-brand-500 focus:ring-brand-500 text-lg font-medium" />
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 bg-green-50 rounded-lg px-4">
                  <span className="text-green-700 font-medium">Your profit per sale</span>
                  <span className="text-green-700 font-bold text-lg">${(parseFloat(retailPrice) * 0.6).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">Back</button>
          )}
          <div className="ml-auto flex gap-3">
            {designUrl && (
              <button onClick={saveDesign} disabled={savingDesign} className="px-6 py-2.5 border border-brand-300 text-brand-700 rounded-lg font-medium hover:bg-brand-50 disabled:opacity-50 transition flex items-center gap-2">
                {savingDesign ? (
                  <div className="animate-spin h-4 w-4 border-2 border-brand-600 border-t-transparent rounded-full" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                )}
                Save Design
              </button>
            )}
            {step < 5 ? (
              <button onClick={() => {
                if (step === 2 && !designUrl) { toast.error("Upload your design first"); return; }
                if (step === 3 && !selectedProviderId) { toast.error("Select a print provider"); return; }
                setStep(step + 1);
              }} className="px-6 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition">Continue</button>
            ) : (
              <div className="flex gap-3">
                <button onClick={addDesignToCart} disabled={creating || !selectedProviderId} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition">
                  Add to Cart
                </button>
                <button onClick={createProduct} disabled={creating || !title || !designUrl} className="px-8 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 transition">
                  {creating ? "Creating..." : "Create Product"}
                </button>
                <button onClick={publishToPrintify} disabled={publishing || !title || !designUrl || !selectedProviderId} className="px-8 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition">
                  {publishing ? "Publishing..." : "Publish to Printify"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PopularProducts({ onSelect }: { onSelect: (item: any) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>("/api/catalog?featured_only=true&per_page=6&page=1")
      .then((res) => setItems(res.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
          <div className="aspect-square bg-gray-100" />
          <div className="p-3"><div className="h-3 bg-gray-100 rounded w-3/4 mb-2" /><div className="h-2 bg-gray-100 rounded w-1/2" /></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item)}
          className="bg-white rounded-xl border border-gray-100 overflow-hidden text-left hover:shadow-lg hover:border-brand-300 transition group"
        >
          <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
            {item.images?.[0] ? (
              <NextImage src={item.images[0]} alt={item.title} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition" />
            ) : <div className="text-4xl text-gray-200">👕</div>}
          </div>
          <div className="p-3">
            <div className="font-medium text-gray-900 text-sm line-clamp-2">{item.title}</div>
            {item.brand && <div className="text-xs text-gray-500 mt-0.5">{item.brand}</div>}
          </div>
        </button>
      ))}
    </div>
  );
}
