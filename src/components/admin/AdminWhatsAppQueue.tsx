import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Users } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface WhatsAppQueueItem {
  id: string;
  subdomain: string;
  phone_number: string;
  display_name: string | null;
  position: number;
  is_active: boolean;
}

interface AdminWhatsAppQueueProps {
  whatsappQueue: WhatsAppQueueItem[];
  currentQueuePosition: number;
  whatsappQueueChanged: boolean;
  onAddItem: () => void;
  onUpdateItem: (id: string, updates: Partial<WhatsAppQueueItem>) => void;
  onDeleteItem: (id: string) => void;
  onSaveQueue: () => void;
}

export const AdminWhatsAppQueue = ({
  whatsappQueue,
  currentQueuePosition,
  whatsappQueueChanged,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onSaveQueue,
}: AdminWhatsAppQueueProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Fila de WhatsApp (Rotação)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure até 5 números que serão usados em rotação. Cada lead será direcionado para o próximo número da fila.
          </p>
        </div>
        <Button onClick={onAddItem} disabled={whatsappQueue.length >= 5}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Número
        </Button>
      </div>

      {whatsappQueue.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>Nenhum número na fila. Será usado o número configurado em "Pós-Conversão".</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-lg text-sm">
            <span className="font-medium">Próximo na fila:</span>{" "}
            {(() => {
              const activeItems = whatsappQueue.filter(q => q.is_active);
              const currentItem = activeItems.find(q => q.position === currentQueuePosition) 
                || activeItems[0];
              return currentItem 
                ? `${currentItem.display_name || "Sem nome"} (${currentItem.phone_number})`
                : "Nenhum número ativo";
            })()}
          </div>

          {whatsappQueue.map((item, index) => (
            <Card key={item.id} className={!item.is_active ? "opacity-60" : ""}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg p-3 min-w-[60px]">
                    <span className="text-xs text-muted-foreground">Posição</span>
                    <span className="text-2xl font-bold text-primary">{index + 1}</span>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Nome do Vendedor</Label>
                        <Input 
                          value={item.display_name || ""} 
                          onChange={(e) => onUpdateItem(item.id, { display_name: e.target.value })}
                          placeholder="Ex: Vendedor 1, Maria"
                        />
                      </div>
                      <div>
                        <Label>Número WhatsApp</Label>
                        <Input 
                          value={item.phone_number} 
                          onChange={(e) => onUpdateItem(item.id, { phone_number: e.target.value })}
                          placeholder="5531999999999"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={item.is_active} 
                          onCheckedChange={(checked) => onUpdateItem(item.id, { is_active: checked })}
                        />
                        <Label className="text-sm">
                          {item.is_active ? "Ativo" : "Inativo (pulado na rotação)"}
                        </Label>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onDeleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button 
            onClick={onSaveQueue} 
            disabled={!whatsappQueueChanged} 
            className="w-full"
          >
            {whatsappQueueChanged ? "Salvar Fila de WhatsApp" : "Fila Salva"}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            A cada novo lead, o sistema redireciona para o próximo número ativo da fila automaticamente.
          </p>
        </div>
      )}
    </div>
  );
};
