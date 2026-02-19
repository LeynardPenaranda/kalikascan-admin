// src/components/AdminsTable.tsx
"use client";

import React, { useMemo, useState } from "react";
import { Table, Tag, Dropdown, Button, ConfigProvider, Spin } from "antd";
import type { TableProps, MenuProps } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import { DEFAULT_ADMIN_AVATAR } from "@/src/constant";

export type AdminRole = "admin" | "superadmin";

export type AdminRow = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  disabled: boolean;
  createdAt: string | null;
  lastSignIn: string | null;
  role: AdminRole;
};

type DataType = {
  key: string; // uid
  uid: string; // ✅ for "You" badge
  name: string;
  email: string;
  role: AdminRole;
  status: "Active" | "Disabled";
  photoURL: string | null;
  raw: AdminRow;
};

function getInitials(nameOrEmail?: string | null) {
  const s = String(nameOrEmail ?? "").trim();
  if (!s) return "A";
  const base = s.includes("@") ? s.split("@")[0] : s;
  const parts = base.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "A";
  const second = parts.length > 1 ? parts[1]?.[0] : "";
  return (first + second).toUpperCase();
}

function AvatarCell({
  src,
  label,
}: {
  src?: string | null;
  label?: string | null;
}) {
  const [imgOk, setImgOk] = useState(true);
  const initials = getInitials(label);
  const finalSrc = src || DEFAULT_ADMIN_AVATAR;

  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="h-8 w-8 rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
        {imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={finalSrc}
            alt="avatar"
            className="h-full w-full object-cover"
            onError={() => setImgOk(false)}
          />
        ) : (
          <span className="text-[11px] font-semibold text-gray-600">
            {initials}
          </span>
        )}
      </div>
      <span className="font-medium truncate">{label || "Admin"}</span>
    </div>
  );
}

export default function AdminsTable({
  admins,
  loading,
  isSuperAdmin,
  myUid,
  onDisableAdmin,
  onDeleteAdmin,
}: {
  admins: AdminRow[];
  loading: boolean;
  isSuperAdmin: boolean;
  myUid: string | null;
  onDisableAdmin: (admin: AdminRow) => void;
  onDeleteAdmin: (admin: AdminRow) => void;
}) {
  const dataSource: DataType[] = useMemo(() => {
    return admins.map((a) => ({
      key: a.uid,
      uid: a.uid,
      name: a.displayName || "No display name",
      email: a.email || "No email",
      role: a.role,
      status: a.disabled ? "Disabled" : "Active",
      photoURL: a.photoURL ?? null,
      raw: a,
    }));
  }, [admins]);

  const columns: TableProps<DataType>["columns"] = [
    {
      title: "Admin",
      key: "admin",
      ellipsis: true,
      render: (_, record) => {
        const isMe = Boolean(myUid && record.uid === myUid);

        return (
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="min-w-0 flex-1">
              <AvatarCell
                src={record.photoURL}
                label={record.name || record.email}
              />
            </div>

            {isMe && (
              <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                You
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      ellipsis: true,
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 140,
      render: (_, r) => (
        <Tag color={r.role === "superadmin" ? "geekblue" : "default"}>
          {String(r.role).toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (_, r) => (
        <Tag color={r.status === "Active" ? "green" : "volcano"}>
          {r.status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 90,
      align: "right",
      render: (_, record) => {
        const admin = record.raw;

        // ONLY superadmins can take actions on "admin" role
        const canManage = isSuperAdmin && admin.role === "admin";
        if (!canManage) return <span className="text-xs text-gray-400">—</span>;

        const items: MenuProps["items"] = [
          {
            key: "disable",
            label: (
              <span className="admin-menu-item">
                {admin.disabled ? "Enable admin" : "Disable admin"}
              </span>
            ),
          },
          {
            key: "delete",
            danger: true,
            label: (
              <span className="admin-menu-delete text-red-600">
                Delete admin
              </span>
            ),
          },
        ];

        const onClick: MenuProps["onClick"] = ({ key }) => {
          if (key === "disable") onDisableAdmin(admin);
          if (key === "delete") onDeleteAdmin(admin);
        };

        return (
          <Dropdown
            menu={{ items, onClick, className: "admin-menu" }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div className="w-full h-full min-h-0 overflow-hidden">
      {/* Menu hover: ONLY Delete becomes bold + remove red bg */}
      <style jsx global>{`
        .admin-menu .ant-dropdown-menu-item:hover .admin-menu-delete,
        .admin-menu .ant-dropdown-menu-item-active .admin-menu-delete {
          font-weight: 700;
        }

        .admin-menu .ant-dropdown-menu-item-danger:hover,
        .admin-menu
          .ant-dropdown-menu-item-danger.ant-dropdown-menu-item-active {
          background: transparent !important;
        }

        /* Right-align pagination */
        .admin-table .ant-table-pagination {
          justify-content: flex-end;
        }
      `}</style>

      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#16a34a", // green
          },
        }}
      >
        <Table<DataType>
          className="h-full admin-table"
          columns={columns}
          dataSource={dataSource}
          size="middle"
          rowClassName={() => "h-[44px]"}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
          }}
          scroll={{ y: "calc(100% - 56px)" }}
          loading={loading ? { indicator: <Spin size="large" /> } : false}
        />
      </ConfigProvider>
    </div>
  );
}
