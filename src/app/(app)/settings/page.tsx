import { Card } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <h1 className="text-xl font-bold text-stone-900 mb-1">Cài đặt</h1>
        <p className="text-sm text-stone-400 mb-8">Tùy chỉnh ứng dụng GP Interior AI</p>

        <Card className="items-center border-dashed py-16 text-center">
          <SettingsIcon className="size-8 text-stone-300 mb-4" />
          <h3 className="font-medium text-stone-600 mb-1">Chưa có cài đặt nào</h3>
          <p className="text-sm text-stone-400 max-w-xs">
            Các tùy chọn cấu hình sẽ xuất hiện ở đây trong bản cập nhật sắp tới.
          </p>
        </Card>
      </div>
    </div>
  );
}
