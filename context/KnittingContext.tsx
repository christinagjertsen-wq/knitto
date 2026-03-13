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

export type NeedleType = 'rundpinne' | 'strømpepinner' | 'rett' | 'utskiftbar';
export type NeedleMaterial = 'bambus' | 'metall' | 'plast' | 'tre';

export interface Needle {
  id: string;
  size: string;
  type: NeedleType;
  lengthCm: number;
  material: NeedleMaterial;
  quantity: number;
  brand?: string;
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
  recipient?: string;
  size?: string;
  gauge?: string;
  patternNeedleSize?: string;
  coverImage?: string;
  progressPercent: number;
  yarnAllocations: YarnAllocation[];
  needleIds: string[];
  primaryYarnStockId?: string;
}

export interface LogEntry {
  id: string;
  projectId: string;
  date: string;
  notes: string;
  radStrikket?: number;
  enhet?: 'cm' | 'omg';
}

interface KnittingContextValue {
  brands: Brand[];
  qualities: Quality[];
  yarnStock: YarnStock[];
  needles: Needle[];
  projects: Project[];
  logEntries: LogEntry[];
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
  getAvailableSkeins: (yarnStockId: string) => number;
  addLogEntry: (entry: Omit<LogEntry, 'id'>) => LogEntry;
  deleteLogEntry: (id: string) => void;
  getLogsForProject: (projectId: string) => LogEntry[];
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
  logEntries: 'knitting_log_entries',
};

function genId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}


export function KnittingProvider({ children }: { children: ReactNode }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [yarnStock, setYarnStock] = useState<YarnStock[]>([]);
  const [needles, setNeedles] = useState<Needle[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const RESET_KEY = 'kera_reset_v1';
        const alreadyReset = await AsyncStorage.getItem(RESET_KEY);
        if (!alreadyReset) {
          await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
          await AsyncStorage.setItem(RESET_KEY, '1');
          setBrands([]);
          setQualities([]);
          setYarnStock([]);
          setNeedles([]);
          setProjects([]);
          setLogEntries([]);
        } else {
          const [b, q, y, n, p, l] = await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.brands),
            AsyncStorage.getItem(STORAGE_KEYS.qualities),
            AsyncStorage.getItem(STORAGE_KEYS.yarnStock),
            AsyncStorage.getItem(STORAGE_KEYS.needles),
            AsyncStorage.getItem(STORAGE_KEYS.projects),
            AsyncStorage.getItem(STORAGE_KEYS.logEntries),
          ]);
          setBrands(b ? JSON.parse(b) : []);
          setQualities(q ? JSON.parse(q) : []);
          setYarnStock(y ? JSON.parse(y) : []);
          setNeedles(n ? JSON.parse(n) : []);
          const loadedProjects: Project[] = p ? JSON.parse(p) : [];
          setProjects(loadedProjects.map(proj => ({ ...proj, progressPercent: proj.progressPercent ?? 0 })));
          setLogEntries(l ? JSON.parse(l) : []);
        }
      } catch (e) {
        setBrands([]);
        setQualities([]);
        setYarnStock([]);
        setNeedles([]);
        setProjects([]);
        setLogEntries([]);
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
      const updated = { ...project };
      if (updated.status === 'ferdig') {
        updated.progressPercent = 100;
      }
      const next = prev.map(p => p.id === id ? { ...p, ...updated } : p);
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
    setLogEntries(prev => {
      const next = prev.filter(l => l.projectId !== id);
      save(STORAGE_KEYS.logEntries, next);
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
  }, [save]);

  const removeYarnFromProject = useCallback((projectId: string, yarnStockId: string) => {
    setProjects(prev => {
      const next = prev.map(p => {
        if (p.id !== projectId) return p;
        return { ...p, yarnAllocations: p.yarnAllocations.filter(a => a.yarnStockId !== yarnStockId) };
      });
      save(STORAGE_KEYS.projects, next);
      return next;
    });
  }, [save]);

  const getAvailableSkeins = useCallback((yarnStockId: string): number => {
    const yarn = yarnStock.find(y => y.id === yarnStockId);
    if (!yarn) return 0;
    const allocated = projects.reduce((sum, p) => {
      const alloc = p.yarnAllocations.find(a => a.yarnStockId === yarnStockId);
      return sum + (alloc?.skeinsAllocated ?? 0);
    }, 0);
    return Math.max(0, yarn.skeins - allocated);
  }, [yarnStock, projects]);

  const addLogEntry = useCallback((entry: Omit<LogEntry, 'id'>): LogEntry => {
    const l: LogEntry = { id: genId(), ...entry };
    setLogEntries(prev => {
      const next = [...prev, l];
      save(STORAGE_KEYS.logEntries, next);
      return next;
    });
    return l;
  }, [save]);

  const deleteLogEntry = useCallback((id: string) => {
    setLogEntries(prev => {
      const next = prev.filter(l => l.id !== id);
      save(STORAGE_KEYS.logEntries, next);
      return next;
    });
  }, [save]);

  const getLogsForProject = useCallback((projectId: string) =>
    logEntries.filter(l => l.projectId === projectId).sort((a, b) => b.date.localeCompare(a.date)),
    [logEntries]);

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
    brands, qualities, yarnStock, needles, projects, logEntries, isLoading,
    addBrand, updateBrand, deleteBrand,
    addQuality, updateQuality, deleteQuality,
    addYarnStock, updateYarnStock, deleteYarnStock,
    addNeedle, updateNeedle, deleteNeedle,
    addProject, updateProject, deleteProject,
    allocateYarnToProject, removeYarnFromProject, getAvailableSkeins,
    addLogEntry, deleteLogEntry, getLogsForProject,
    getQualitiesForBrand, getYarnStockForQuality,
    getTotalStats, getBrandById, getQualityById, getYarnStockById, getProjectById,
  }), [brands, qualities, yarnStock, needles, projects, logEntries, isLoading,
    addBrand, updateBrand, deleteBrand, addQuality, updateQuality, deleteQuality,
    addYarnStock, updateYarnStock, deleteYarnStock, addNeedle, updateNeedle, deleteNeedle,
    addProject, updateProject, deleteProject, allocateYarnToProject, removeYarnFromProject, getAvailableSkeins,
    addLogEntry, deleteLogEntry, getLogsForProject,
    getQualitiesForBrand, getYarnStockForQuality, getTotalStats, getBrandById, getQualityById, getYarnStockById, getProjectById]);

  return <KnittingContext.Provider value={value}>{children}</KnittingContext.Provider>;
}

export function useKnitting() {
  const ctx = useContext(KnittingContext);
  if (!ctx) throw new Error('useKnitting must be used within KnittingProvider');
  return ctx;
}
