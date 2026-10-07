import { MapPin, Phone, User, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AddressResponse } from "@/lib/adapters/identity";

export interface AddressCardProps {
  address: AddressResponse;
  onEdit: (address: AddressResponse) => void;
  onDelete: (id: string) => void;
}

export function AddressCard({ address, onEdit, onDelete }: AddressCardProps) {
  return (
    <Card className="relative hover:border-primary/50 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-base text-fg">{address.label}</span>
            {address.isDefault && (
              <Badge variant="primary" className="text-[11px] h-5">
                Mặc định
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(address)}
              aria-label="Chỉnh sửa địa chỉ"
              title="Chỉnh sửa"
            >
              <Edit className="h-4 w-4 text-fg-secondary" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(address.addressId)}
              aria-label="Xóa địa chỉ"
              title="Xóa"
              className="hover:text-danger"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-1.5 text-sm text-fg-secondary">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-fg-tertiary shrink-0" />
            <span className="font-medium text-fg">{address.contactName}</span>
            <span className="text-fg-tertiary">|</span>
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5 text-fg-tertiary" />
              {address.contactPhone}
            </span>
          </div>

          <div className="flex items-start gap-2 pt-1">
            <MapPin className="h-4 w-4 text-fg-tertiary shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {address.line1}, {address.ward}, {address.district}, {address.city}
            </p>
          </div>

          {address.note && (
            <p className="text-xs text-fg-tertiary italic pl-6 pt-0.5">
              Ghi chú: {address.note}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
