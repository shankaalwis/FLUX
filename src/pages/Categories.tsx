import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
    ChevronRight, ChevronDown, Plus, Pencil, Trash2, FolderTree, ArrowRight, GitMerge, AlertCircle
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Type definitions
type CategoryNode = {
    name: string;      // Leaf name
    fullName: string;  // Full path
    total: number;
    count: number;
    children: Record<string, CategoryNode>;
};

// Levenshtein distance for fuzzy matching
const levenshtein = (a: string, b: string): number => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

export default function Categories() {
    const { data: transactions = [], isLoading: txLoading, refetch } = useTransactions(null);
    const { user } = useAuth();
    const [metaCategories, setMetaCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Initial load of metadata
    useEffect(() => {
        if (user?.user_metadata?.categories) {
            setMetaCategories(user.user_metadata.categories);
        }
    }, [user]);

    // Derived: all unique category names (flat list) for matching
    const flatCategoryList = useMemo(() => {
        const set = new Set(metaCategories);
        transactions.forEach(t => {
            const c = t.user_override_category || t.category;
            if (c) set.add(c);
        });
        return Array.from(set).sort();
    }, [metaCategories, transactions]);

    // Identify Duplicate Suggestions
    const mergeSuggestions = useMemo(() => {
        const suggestions: Array<{ a: string, b: string, score: number }> = [];
        const ignored = new Set<string>(); // avoid A-B, B-A duplicates

        for (let i = 0; i < flatCategoryList.length; i++) {
            for (let j = i + 1; j < flatCategoryList.length; j++) {
                const a = flatCategoryList[i];
                const b = flatCategoryList[j];

                // Skip basic containment (e.g. "Auto" vs "Auto: Fuel" is NOT a duplicate suggestion)
                // We want to merge "Transport" and "Transportation" or "Grocries" and "Groceries"
                if (a.startsWith(b + ":") || b.startsWith(a + ":")) continue;

                const dist = levenshtein(a.toLowerCase(), b.toLowerCase());
                const maxLength = Math.max(a.length, b.length);

                // Threshold: If logical difference is small (e.g. < 3 chars) OR ratio is tight
                if (dist <= 2 && maxLength > 4) {
                    suggestions.push({ a, b, score: dist });
                } else if (dist === 3 && maxLength > 8) {
                    suggestions.push({ a, b, score: dist });
                }
            }
        }
        return suggestions;
    }, [flatCategoryList]);


    // Build Tree
    const categoryTree = useMemo(() => {
        const tree: Record<string, CategoryNode> = {};
        const allNames = new Set<string>(flatCategoryList);
        if (allNames.size === 0) allNames.add("Uncategorized");

        Array.from(allNames).sort().forEach(fullName => {
            const parts = fullName.split(':').map(s => s.trim());
            let currentLevel = tree;
            let currentPath = "";

            parts.forEach((part, index) => {
                currentPath = currentPath ? `${currentPath}: ${part}` : part;
                if (!currentLevel[part]) {
                    currentLevel[part] = {
                        name: part, fullName: currentPath, total: 0, count: 0, children: {}
                    };
                }
                if (index < parts.length - 1) currentLevel = currentLevel[part].children;
            });
        });

        transactions.forEach(t => {
            const cat = t.user_override_category || t.category || "Uncategorized";
            const amount = Math.abs(t.amount);
            const parts = cat.split(':').map(s => s.trim());
            let currentLevel = tree;
            parts.forEach((part, index) => {
                if (currentLevel[part]) {
                    currentLevel[part].total += amount;
                    currentLevel[part].count += 1;
                    if (index < parts.length - 1) currentLevel = currentLevel[part].children;
                }
            });
        });

        return tree;
    }, [transactions, flatCategoryList]);

    // --- CRUD Actions ---

    // CREATE
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newCatParent, setNewCatParent] = useState('none');

    const handleCreate = async () => {
        if (!newCatName) return;
        setLoading(true);
        try {
            const finalName = newCatParent !== 'none' ? `${newCatParent}: ${newCatName}` : newCatName;
            const updatedCategories = Array.from(new Set([...metaCategories, finalName]));
            const { error } = await supabase.auth.updateUser({ data: { categories: updatedCategories } });
            if (error) throw error;
            setMetaCategories(updatedCategories);
            toast.success("Category created");
            setCreateDialogOpen(false);
            setNewCatName('');
            setNewCatParent('none');
        } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
    };

    // UPDATE (Rename)
    const [editNode, setEditNode] = useState<CategoryNode | null>(null);
    const [renameValue, setRenameValue] = useState('');

    const handleRename = async () => {
        if (!editNode || !renameValue) return;
        // ... (Same implementation as previous step, omitted for brevity, will be preserved)
        // Actually I am replacing the whole file content so I need to provide full implementation.
        setLoading(true);
        try {
            const parentPath = editNode.fullName.substring(0, editNode.fullName.lastIndexOf(editNode.name));
            const newFullName = parentPath ? `${parentPath}${renameValue}` : renameValue;
            const oldFullName = editNode.fullName;

            const updates = transactions
                .filter(t => {
                    const curr = t.user_override_category || t.category || '';
                    return curr === oldFullName || curr.startsWith(`${oldFullName}:`);
                })
                .map(t => ({
                    id: t.id,
                    user_override_category: (t.user_override_category || t.category || '').replace(oldFullName, newFullName)
                }));

            for (const update of updates) {
                await supabase.from('transactions').update({ user_override_category: update.user_override_category }).eq('id', update.id);
            }

            const updatedMeta = metaCategories.map(c =>
                (c === oldFullName || c.startsWith(`${oldFullName}:`)) ? c.replace(oldFullName, newFullName) : c
            );
            if (!updatedMeta.includes(newFullName)) updatedMeta.push(newFullName);
            await supabase.auth.updateUser({ data: { categories: updatedMeta } });
            setMetaCategories(updatedMeta);
            toast.success("Category renamed");
            refetch();
            setEditNode(null);
        } catch (e: any) { toast.error("Rename failed"); } finally { setLoading(false); }
    };

    // MERGE
    const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
    const [mergeSource, setMergeSource] = useState('');
    const [mergeTarget, setMergeTarget] = useState('');

    // Auto-fill merge dialog from suggestion
    const openMerge = (source?: string, target?: string) => {
        setMergeSource(source || '');
        setMergeTarget(target || '');
        setMergeDialogOpen(true);
    };

    const handleMerge = async () => {
        if (!mergeSource || !mergeTarget) return;
        if (mergeSource === mergeTarget) { toast.error("Cannot merge same category"); return; }

        setLoading(true);
        try {
            // 1. Update matching transactions
            // If merging "Transport" into "Transportation", we also want "Transport: Bus" -> "Transportation: Bus"
            // Similar to Rename logic, but the target prefix matches `mergeTarget`.

            const updates = transactions
                .filter(t => {
                    const curr = t.user_override_category || t.category || '';
                    return curr === mergeSource || curr.startsWith(`${mergeSource}:`);
                })
                .map(t => ({
                    id: t.id,
                    user_override_category: (t.user_override_category || t.category || '').replace(mergeSource, mergeTarget)
                }));

            for (const update of updates) {
                await supabase.from('transactions').update({ user_override_category: update.user_override_category }).eq('id', update.id);
            }

            // 2. Cleanup Metadata: Remove `mergeSource`, keep `mergeTarget`.
            // Any subCategories of source must also be renamed in metadata?
            const updatedMeta = metaCategories
                .filter(c => c !== mergeSource && !c.startsWith(`${mergeSource}:`)) // Remove old Source
                .map(c => c); // No, this logic is flawed for metadata.
            // If I have "Transport: Bus" in metadata, and I merge "Transport" -> "Transportation",
            // "Transport: Bus" should ideally become "Transportation: Bus" in metadata too, OR be deleted if unused?
            // Since "Merge" implies "Consolidate", let's behave like Rename for Metadata too,
            // but if the Target already exists, we dedupe.

            // Correct Logic:
            // 1. Rename all Source* to Target* in metadata list.
            // 2. Filter unique to remove duplicates.
            const mappedMeta = metaCategories.map(c =>
                (c === mergeSource || c.startsWith(`${mergeSource}:`))
                    ? c.replace(mergeSource, mergeTarget)
                    : c
            );
            const uniqueMeta = Array.from(new Set(mappedMeta));

            await supabase.auth.updateUser({ data: { categories: uniqueMeta } });
            setMetaCategories(uniqueMeta);

            toast.success(`Merged ${updates.length} transactions`);
            refetch();
            setMergeDialogOpen(false);
            setMergeSource('');
            setMergeTarget('');
        } catch (e: any) { toast.error("Merge failed"); } finally { setLoading(false); }
    };

    // DELETE (Simplified)
    const [deleteNode, setDeleteNode] = useState<CategoryNode | null>(null);
    const handleDelete = async () => {
        if (!deleteNode) return;
        setLoading(true);
        try {
            const target = deleteNode.fullName;
            const { error: txError } = await supabase.from('transactions')
                .update({ user_override_category: null })
                .or(`user_override_category.eq.${target},user_override_category.like.${target}:%`);
            if (txError) throw txError;
            const updatedMeta = metaCategories.filter(c => c !== target && !c.startsWith(`${target}:`));
            await supabase.auth.updateUser({ data: { categories: updatedMeta } });
            setMetaCategories(updatedMeta);
            toast.success("Category deleted");
            refetch();
            setDeleteNode(null);
        } catch (e: any) { toast.error("Delete failed"); } finally { setLoading(false); }
    };

    const openCreateSub = (parent: string) => {
        setNewCatParent(parent);
        setCreateDialogOpen(true);
    };

    if (txLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
                    <p className="text-muted-foreground">Manage hierarchy and clean up duplicates</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => openMerge()}>
                        <GitMerge className="h-4 w-4 mr-2" />
                        Merge Tool
                    </Button>
                    <Button onClick={() => { setNewCatParent('none'); setCreateDialogOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Category
                    </Button>
                </div>
            </div>

            {/* SUGGESTIONS PANEL */}
            {mergeSuggestions.length > 0 && (
                <Alert className="bg-amber-500/10 border-amber-500/50 text-amber-500">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Duplicate Categories Detected</AlertTitle>
                    <AlertDescription className="mt-2">
                        <div className="flex flex-col gap-2">
                            {mergeSuggestions.map((s, i) => (
                                <div key={i} className="flex items-center justify-between bg-background/50 p-2 rounded border">
                                    <div className="flex items-center gap-2 text-sm text-foreground">
                                        <Badge variant="outline">{s.a}</Badge>
                                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                        <Badge variant="outline">{s.b}</Badge>
                                    </div>
                                    <Button size="sm" variant="secondary" onClick={() => openMerge(s.a, s.b)}>Merge</Button>
                                </div>
                            ))}
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tree */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Hierarchy</CardTitle>
                        <CardDescription>{Object.keys(categoryTree).length} Main Categories</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            {Object.values(categoryTree).map(node => (
                                <CategoryItem
                                    key={node.fullName}
                                    node={node}
                                    onEdit={setEditNode}
                                    onDelete={setDeleteNode}
                                    onCreateSub={openCreateSub}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Tips */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Quick Tips</CardTitle></CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                            <p>• <strong>Matching:</strong> Similar names like "Transport" and "Transportation" appear in matches automatically.</p>
                            <p>• <strong>Merge:</strong> Consolidates transactions and sub-categories into one.</p>
                            <p>• <strong>Hierarchy:</strong> Use the "New Category" button to create parents and children.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* CREATE DIALOG */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Create Category</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2"><Label>Name</Label><Input value={newCatName} onChange={e => setNewCatName(e.target.value)} /></div>
                        <div className="space-y-2">
                            <Label>Parent (Optional)</Label>
                            <Select value={newCatParent} onValueChange={setNewCatParent}>
                                <SelectTrigger><SelectValue placeholder="Top Level" /></SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    <SelectItem value="none">-- Top Level --</SelectItem>
                                    {flatCategoryList.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleCreate} disabled={loading || !newCatName}>Create</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MERGE DIALOG */}
            <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Merge Categories</DialogTitle>
                        <DialogDescription>Move all transactions and sub-categories from Source to Target.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Source (Will be deleted)</Label>
                            <Select value={mergeSource} onValueChange={setMergeSource}>
                                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {flatCategoryList.filter(c => c !== mergeTarget).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-center"><ArrowRight className="text-muted-foreground rotate-90 md:rotate-0" /></div>
                        <div className="space-y-2">
                            <Label>Target (Will keep)</Label>
                            <Select value={mergeTarget} onValueChange={setMergeTarget}>
                                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {flatCategoryList.filter(c => c !== mergeSource).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleMerge} disabled={loading || !mergeSource || !mergeTarget}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Merge
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* EDIT & DELETE DIALOGS (Simplified reuse of existing state) */}
            <Dialog open={!!editNode} onOpenChange={(open) => !open && setEditNode(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Rename Category</DialogTitle></DialogHeader>
                    <div className="py-4"><Input value={renameValue} onChange={e => setRenameValue(e.target.value)} placeholder={editNode?.name} /></div>
                    <DialogFooter><Button onClick={handleRename} disabled={loading}>Save</Button></DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={!!deleteNode} onOpenChange={(open) => !open && setDeleteNode(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Delete Category</DialogTitle><DialogDescription>Transactions will be Uncategorized.</DialogDescription></DialogHeader>
                    <DialogFooter><Button variant="destructive" onClick={handleDelete} disabled={loading}>Delete</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Tree Item Component
function CategoryItem({ node, onEdit, onDelete, onCreateSub, depth = 0 }: {
    node: CategoryNode,
    onEdit: any,
    onDelete: any,
    onCreateSub: (parent: string) => void,
    depth?: number
}) {
    const hasChildren = Object.keys(node.children).length > 0;
    const [isOpen, setIsOpen] = useState(depth < 1);

    return (
        <div className="select-none">
            <div className={cn("flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors group", depth > 0 && "ml-4 border-l pl-2")}>
                <div className="flex items-center gap-2 flex-1">
                    {hasChildren ? (
                        <Button variant="ghost" size="icon" className="h-4 w-4 p-0" onClick={() => setIsOpen(!isOpen)}>
                            {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                    ) : <div className="w-4" />}
                    <span className="font-medium">{node.name}</span>
                    <Badge variant="secondary" className="text-xs h-5 px-1 ml-2 text-muted-foreground font-normal">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(node.total)}
                    </Badge>
                </div>
                <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onCreateSub(node.fullName)} title="Add Subcategory">
                        <Plus className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(node)} title="Rename">
                        <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={() => onDelete(node)} title="Delete">
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </div>
            {hasChildren && isOpen && (
                <div className="mt-1">{Object.values(node.children).sort((a, b) => a.name.localeCompare(b.name)).map(child => (
                    <CategoryItem key={child.fullName} node={child} onEdit={onEdit} onDelete={onDelete} onCreateSub={onCreateSub} depth={depth + 1} />
                ))}</div>
            )}
        </div>
    );
}

