import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Brand {
  id: string;
  name: string;
}

export interface Quality {
  id: string;
  brandId: string;
  name: string;
  fiberContent: string;
  gramsPerSkein: number;
  metersPerSkein: number;
}

export interface YarnStock {
  id: string;
  qualityId: string;
  colorName: string;
  colorHex: string;
  skeins: number;
}

export type NeedleType = 'rundpinne' | 'strømpepinner' | 'rett';
export type NeedleMaterial = 'bambus' | 'metall' | 'plast' | 'tre';

export interface Needle {
  id: string;
  size: string;
  type: NeedleType;
  lengthCm: number;
  material: NeedleMaterial;
  quantity: number;
}

export interface YarnAllocation {
  yarnStockId: string;
  skeinsAllocated: number;
}

export type ProjectStatus = 'planlagt' | 'aktiv' | 'ferdig';

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  notes: string;
  yarnAllocations: YarnAllocation[];
  needleIds: string[];
}

interface KnittingContextValue {
  brands: Brand[];
  qualities: Quality[];
  yarnStock: YarnStock[];
  needles: Needle[];
  projects: Project[];
  isLoading: boolean;
  addBrand: (name: string) => Brand;
  updateBrand: (id: string, name: string) => void;
  deleteBrand: (id: string) => void;
  addQuality: (quality: Omit<Quality, 'id'>) => Quality;
  updateQuality: (id: string, quality: Partial<Omit<Quality, 'id'>>) => void;
  deleteQuality: (id: string) => void;
  addYarnStock: (yarn: Omit<YarnStock, 'id'>) => YarnStock;
  updateYarnStock: (id: string, yarn: Partial<Omit<YarnStock, 'id'>>) => void;
  deleteYarnStock: (id: string) => void;
  addNeedle: (needle: Omit<Needle, 'id'>) => Needle;
  updateNeedle: (id: string, needle: Partial<Omit<Needle, 'id'>>) => void;
  deleteNeedle: (id: string) => void;
  addProject: (project: Omit<Project, 'id'>) => Project;
  updateProject: (id: string, project: Partial<Omit<Project, 'id'>>) => void;
  deleteProject: (id: string) => void;
  allocateYarnToProject: (projectId: string, yarnStockId: string, skeins: number) => void;
  removeYarnFromProject: (projectId: string, yarnStockId: string) => void;
  getQualitiesForBrand: (brandId: string) => Quality[];
  getYarnStockForQuality: (qualityId: string) => YarnStock[];
  getTotalStats: () => { totalSkeins: number; totalGrams: number; totalMeters: number };
  getBrandById: (id: string) => Brand | undefined;
  getQualityById: (id: string) => Quality | undefined;
  getYarnStockById: (id: string) => YarnStock | undefined;
  getProjectById: (id: string) => Project | undefined;
}

const KnittingContext = createContext<KnittingContextValue | null>(null);

const STORAGE_KEYS = {
  brands: 'knitting_brands',
  qualities: 'knitting_qualities',
  yarnStock: 'knitting_yarn_stock',
  needles: 'knitting_needles',
  projects: 'knitting_projects',
};

function genId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

const DEMO_DATA = {
  brands: [
    { id: 'b1', name: 'Sandnes Garn' },
    { id: 'b2', name: 'Filcolana' },
  ] as Brand[],
  qualities: [
    { id: 'q1', brandId: 'b1', name: 'Tynn Merinoull', fiberContent: '100% Merinoull', gramsPerSkein: 50, metersPerSkein: 175 },
    { id: 'q2', brandId: 'b1', name: 'KOS', fiberContent: '55% Alpakka, 45% Merinoull', gramsPerSkein: 50, metersPerSkein: 130 },
    { id: 'q3', brandId: 'b2', name: 'Arwetta Classic', fiberContent: '80% Merinoull, 20% Polyamid', gramsPerSkein: 50, metersPerSkein: 210 },
  ] as Quality[],
  yarnStock: [
    { id: 'y1', qualityId: 'q1', colorName: 'Natthimmel', colorHex: '#2E3D6E', skeins: 4 },
    { id: 'y2', qualityId: 'q1', colorName: 'Dusty Rose', colorHex: '#C97B84', skeins: 2 },
    { id: 'y3', qualityId: 'q2', colorName: 'Elfenben', colorHex: '#F5EDE8', skeins: 6 },
    { id: 'y4', qualityId: 'q3', colorName: 'Skoggrønn', colorHex: '#5C9E8A', skeins: 3 },
  ] as YarnStock[],
  needles: [
    { id: 'n1', size: '2.5', type: 'rundpinne' as NeedleType, lengthCm: 80, material: 'metall' as NeedleMaterial, quantity: 1 },
    { id: 'n2', size: '3.5', type: 'rundpinne' as NeedleType, lengthCm: 60, material: 'bambus' as NeedleMaterial, quantity: 2 },
    { id: 'n3', size: '2.5', type: 'strømpepinner' as NeedleType, lengthCm: 20, material: 'metall' as NeedleMaterial, quantity: 1 },
  ] as Needle[],
  projects: [
    {
      id: 'p1',
      name: 'Sjømansgenser',
      status: 'aktiv' as ProjectStatus,
      startDate: '2026-01-15',
      notes: 'Klassisk norsk genser til vinteren',
      yarnAllocations: [{ yarnStockId: 'y1', skeinsAllocated: 3 }],
      needleIds: ['n1'],
    },
    {
      id: 'p2',
      name: 'Babylue',
      status: 'planlagt' as ProjectStatus,
      notes: '',
      yarnAllocations: [{ yarnStockId: 'y2', skeinsAllocated: 1 }],
      needleIds: ['n3'],
    },
  ] as Project[],
};

export function KnittingProvider({ children }: { children: ReactNode }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [yarnStock, setYarnStock] = useState<YarnStock[]>([]);
  const [needles, setNeedles] = useState<Needle[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [b, q, y, n, p] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.brands),
          AsyncStorage.getItem(STORAGE_KEYS.qualities),
          AsyncStorage.getItem(STORAGE_KEYS.yarnStock),
          AsyncStorage.getItem(STORAGE_KEYS.needles),
          AsyncStorage.getItem(STORAGE_KEYS.projects),
        ]);
        setBrands(b ? JSON.parse(b) : DEMO_DATA.brands);
        setQualities(q ? JSON.parse(q) : DEMO_DATA.qualities);
        setYarnStock(y ? JSON.parse(y) : DEMO_DATA.yarnStock);
        setNeedles(n ? JSON.parse(n) : DEMO_DATA.needles);
        setProjects(p ? JSON.parse(p) : DEMO_DATA.projects);
      } catch (e) {
        setBrands(DEMO_DATA.brands);
        setQualities(DEMO_DATA.qualities);
        setYarnStock(DEMO_DATA.yarnStock);
        setNeedles(DEMO_DATA.needles);
        setProjects(DEMO_DATA.projects);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const save = useCallback(async (key: string, data: unknown) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {}
  }, []);

  const addBrand = useCallback((name: string): Brand => {
    const brand: Brand = { id: genId(), name };
    setBrands(prev => {
      const next = [...prev, brand];
      save(STORAGE_KEYS.brands, next);
      return next;
    });
    return brand;
  }, [save]);

  const updateBrand = useCallback((id: string, name: string) => {
    setBrands(prev => {
      const next = prev.map(b => b.id === id ? { ...b, name } : b);
      save(STORAGE_KEYS.brands, next);
      return next;
    });
  }, [save]);

  const deleteBrand = useCallback((id: string) => {
    setBrands(prev => {
      const next = prev.filter(b => b.id !== id);
      save(STORAGE_KEYS.brands, next);
      return next;
    });
    setQualities(prev => {
      const next = prev.filter(q => q.brandId !== id);
      save(STORAGE_KEYS.qualities, next);
      return next;
    });
  }, [save]);

  const addQuality = useCallback((quality: Omit<Quality, 'id'>): Quality => {
    const q: Quality = { id: genId(), ...quality };
    setQualities(prev => {
      const next = [...prev, q];
      save(STORAGE_KEYS.qualities, next);
      return next;
    });
    return q;
  }, [save]);

  const updateQuality = useCallback((id: string, quality: Partial<Omit<Quality, 'id'>>) => {
    setQualities(prev => {
      const next = prev.map(q => q.id === id ? { ...q, ...quality } : q);
      save(STORAGE_KEYS.qualities, next);
      return next;
    });
  }, [save]);

  const deleteQuality = useCallback((id: string) => {
    setQualities(prev => {
      const next = prev.filter(q => q.id !== id);
      save(STORAGE_KEYS.qualities, next);
      return next;
    });
    setYarnStock(prev => {
      const next = prev.filter(y => y.qualityId !== id);
      save(STORAGE_KEYS.yarnStock, next);
      return next;
    });
  }, [save]);

  const addYarnStock = useCallback((yarn: Omit<YarnStock, 'id'>): YarnStock => {
    const y: YarnStock = { id: genId(), ...yarn };
    setYarnStock(prev => {
      const next = [...prev, y];
      save(STORAGE_KEYS.yarnStock, next);
      return next;
    });
    return y;
  }, [save]);

  const updateYarnStock = useCallback((id: string, yarn: Partial<Omit<YarnStock, 'id'>>) => {
    setYarnStock(prev => {
      const next = prev.map(y => y.id === id ? { ...y, ...yarn } : y);
      save(STORAGE_KEYS.yarnStock, next);
      return next;
    });
  }, [save]);

  const deleteYarnStock = useCallback((id: string) => {
    setYarnStock(prev => {
      const next = prev.filter(y => y.id !== id);
      save(STORAGE_KEYS.yarnStock, next);
      return next;
    });
  }, [save]);

  const addNeedle = useCallback((needle: Omit<Needle, 'id'>): Needle => {
    const n: Needle = { id: genId(), ...needle };
    setNeedles(prev => {
      const next = [...prev, n];
      save(STORAGE_KEYS.needles, next);
      return next;
    });
    return n;
  }, [save]);

  const updateNeedle = useCallback((id: string, needle: Partial<Omit<Needle, 'id'>>) => {
    setNeedles(prev => {
      const next = prev.map(n => n.id === id ? { ...n, ...needle } : n);
      save(STORAGE_KEYS.needles, next);
      return next;
    });
  }, [save]);

  const deleteNeedle = useCallback((id: string) => {
    setNeedles(prev => {
      const next = prev.filter(n => n.id !== id);
      save(STORAGE_KEYS.needles, next);
      return next;
    });
  }, [save]);

  const addProject = useCallback((project: Omit<Project, 'id'>): Project => {
    const p: Project = { id: genId(), ...project };
    setProjects(prev => {
      const next = [...prev, p];
      save(STORAGE_KEYS.projects, next);
      return next;
    });
    return p;
  }, [save]);

  const updateProject = useCallback((id: string, project: Partial<Omit<Project, 'id'>>) => {
    setProjects(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...project } : p);
      save(STORAGE_KEYS.projects, next);
      return next;
    });
  }, [save]);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => {
      const next = prev.filter(p => p.id !== id);
      save(STORAGE_KEYS.projects, next);
      return next;
    });
  }, [save]);

  const allocateYarnToProject = useCallback((projectId: string, yarnStockId: string, skeins: number) => {
    setProjects(prev => {
      const next = prev.map(p => {
        if (p.id !== projectId) return p;
        const existing = p.yarnAllocations.find(a => a.yarnStockId === yarnStockId);
        let newAllocations: YarnAllocation[];
        if (existing) {
          newAllocations = p.yarnAllocations.map(a =>
            a.yarnStockId === yarnStockId ? { ...a, skeinsAllocated: a.skeinsAllocated + skeins } : a
          );
        } else {
          newAllocations = [...p.yarnAllocations, { yarnStockId, skeinsAllocated: skeins }];
        }
        return { ...p, yarnAllocations: newAllocations };
      });
      save(STORAGE_KEYS.projects, next);
      return next;
    });
    setYarnStock(prev => {
      const next = prev.map(y => y.id === yarnStockId ? { ...y, skeins: Math.max(0, y.skeins - skeins) } : y);
      save(STORAGE_KEYS.yarnStock, next);
      return next;
    });
  }, [save]);

  const removeYarnFromProject = useCallback((projectId: string, yarnStockId: string) => {
    let skeinsToReturn = 0;
    setProjects(prev => {
      const next = prev.map(p => {
        if (p.id !== projectId) return p;
        const alloc = p.yarnAllocations.find(a => a.yarnStockId === yarnStockId);
        if (alloc) skeinsToReturn = alloc.skeinsAllocated;
        return { ...p, yarnAllocations: p.yarnAllocations.filter(a => a.yarnStockId !== yarnStockId) };
      });
      save(STORAGE_KEYS.projects, next);
      return next;
    });
    if (skeinsToReturn > 0) {
      setYarnStock(prev => {
        const next = prev.map(y => y.id === yarnStockId ? { ...y, skeins: y.skeins + skeinsToReturn } : y);
        save(STORAGE_KEYS.yarnStock, next);
        return next;
      });
    }
  }, [save]);

  const getQualitiesForBrand = useCallback((brandId: string) => qualities.filter(q => q.brandId === brandId), [qualities]);
  const getYarnStockForQuality = useCallback((qualityId: string) => yarnStock.filter(y => y.qualityId === qualityId), [yarnStock]);
  const getBrandById = useCallback((id: string) => brands.find(b => b.id === id), [brands]);
  const getQualityById = useCallback((id: string) => qualities.find(q => q.id === id), [qualities]);
  const getYarnStockById = useCallback((id: string) => yarnStock.find(y => y.id === id), [yarnStock]);
  const getProjectById = useCallback((id: string) => projects.find(p => p.id === id), [projects]);

  const getTotalStats = useCallback(() => {
    let totalSkeins = 0;
    let totalGrams = 0;
    let totalMeters = 0;
    for (const yarn of yarnStock) {
      const quality = qualities.find(q => q.id === yarn.qualityId);
      if (quality) {
        totalSkeins += yarn.skeins;
        totalGrams += yarn.skeins * quality.gramsPerSkein;
        totalMeters += yarn.skeins * quality.metersPerSkein;
      }
    }
    return { totalSkeins, totalGrams, totalMeters };
  }, [yarnStock, qualities]);

  const value = useMemo<KnittingContextValue>(() => ({
    brands, qualities, yarnStock, needles, projects, isLoading,
    addBrand, updateBrand, deleteBrand,
    addQuality, updateQuality, deleteQuality,
    addYarnStock, updateYarnStock, deleteYarnStock,
    addNeedle, updateNeedle, deleteNeedle,
    addProject, updateProject, deleteProject,
    allocateYarnToProject, removeYarnFromProject,
    getQualitiesForBrand, getYarnStockForQuality,
    getTotalStats, getBrandById, getQualityById, getYarnStockById, getProjectById,
  }), [brands, qualities, yarnStock, needles, projects, isLoading,
    addBrand, updateBrand, deleteBrand, addQuality, updateQuality, deleteQuality,
    addYarnStock, updateYarnStock, deleteYarnStock, addNeedle, updateNeedle, deleteNeedle,
    addProject, updateProject, deleteProject, allocateYarnToProject, removeYarnFromProject,
    getQualitiesForBrand, getYarnStockForQuality, getTotalStats, getBrandById, getQualityById, getYarnStockById, getProjectById]);

  return <KnittingContext.Provider value={value}>{children}</KnittingContext.Provider>;
}

export function useKnitting() {
  const ctx = useContext(KnittingContext);
  if (!ctx) throw new Error('useKnitting must be used within KnittingProvider');
  return ctx;
}
