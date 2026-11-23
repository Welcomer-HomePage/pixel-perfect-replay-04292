import { Link } from "@tanstack/react-router";
import { Database } from "lucide-react";
import { Button } from "./ui/button";
import { isAdmin, useSession } from "@/lib/auth";
export function EmptyData() {
 const session=useSession();
 return <div className="flex flex-col items-center gap-3 border-y py-12 text-center"><Database className="h-8 w-8 text-muted-foreground"/><h2 className="font-display text-2xl font-bold text-wine">Aún no hay datos</h2>{isAdmin(session)?<Button asChild><Link to="/datos">Cargar datos</Link></Button>:<p className="text-sm text-muted-foreground">No hay registros asignados a tu perfil.</p>}</div>;
}