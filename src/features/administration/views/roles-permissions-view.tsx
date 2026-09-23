"use client";

import { useMemo, useState } from "react";

import {
  AlertTriangle,
  ChevronRight,
  CircleCheck,
  Eye,
  KeyRound,
  LockKeyhole,
  Plus,
  Save,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import common from "@/features/resident-registry/components/resident-registry.module.css";

import { ACCESS_ACCOUNTS } from "../data/access-data";
import { PERMISSION_LEVELS, ROLE_DEFINITIONS } from "../data/role-data";
import type { PermissionLevel, RoleDefinition } from "../types/access";
import styles from "./administration.module.css";

const formatDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

const groups = ["Registry", "Services", "Safety & Planning", "Governance"] as const;

const levelClass = (level: PermissionLevel) => {
  if (level === "Manage") return styles.levelManage;
  if (level === "Create & update") return styles.levelEdit;
  if (level === "View") return styles.levelView;
  return styles.levelNone;
};

export function RolesPermissionsView() {
  const [roles, setRoles] = useState(ROLE_DEFINITIONS);
  const [selectedId, setSelectedId] = useState(ROLE_DEFINITIONS[0].id);
  const [savedRoles, setSavedRoles] = useState(ROLE_DEFINITIONS);
  const [notice, setNotice] = useState("");
  const selected = roles.find((item) => item.id === selectedId) ?? roles[0];
  const savedSelected = savedRoles.find((item) => item.id === selected.id);
  const hasChanges = JSON.stringify(selected.permissions) !== JSON.stringify(savedSelected?.permissions);
  const accountCount = (roleName: RoleDefinition["name"]) =>
    ACCESS_ACCOUNTS.filter((account) => account.role === roleName).length;
  const assignedAccounts = accountCount(selected.name);
  const allowedModules = selected.permissions.filter((item) => item.level !== "No access").length;
  const managedModules = selected.permissions.filter((item) => item.level === "Manage").length;
  const restrictedModules = selected.permissions.filter((item) => item.sensitiveFields).length;

  const updatePermission = (moduleId: string, level: PermissionLevel) => {
    setNotice("");
    setRoles((current) =>
      current.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              permissions: item.permissions.map((permission) =>
                permission.moduleId === moduleId ? { ...permission, level } : permission,
              ),
            }
          : item,
      ),
    );
  };

  const saveChanges = () => {
    setSavedRoles(roles);
    setNotice(`${selected.name} permissions saved to the role history.`);
  };

  const resetChanges = () => {
    if (!savedSelected) return;
    setRoles((current) => current.map((item) => (item.id === selected.id ? savedSelected : item)));
    setNotice("");
  };

  const riskMessage = useMemo(() => {
    if (selected.name === "Public")
      return "Public access must never expose personal data or internal transaction records.";
    if (selected.scope === "All barangays")
      return "This role can read across all barangays. Review every permission before saving.";
    return "Permissions apply only inside the assigned barangay or municipal office scope.";
  }, [selected]);

  return (
    <div className={common.page}>
      <header className={common.pageHeader}>
        <div>
          <p className={common.eyebrow}>A11 Security & Access Control</p>
          <h1>Roles and Permissions</h1>
          <p>Define what each user role can view, update, approve, and administer across Barangay Affairs.</p>
        </div>
        <button className={common.primaryButton} type="button">
          <Plus size={15} />
          Create custom role
        </button>
      </header>

      {notice && (
        <div className={styles.successNotice}>
          <CircleCheck size={16} />
          {notice}
        </div>
      )}

      <div className={styles.rolesWorkspace}>
        <section className={`${common.card} ${styles.roleDirectory}`}>
          <div className={styles.panelHeading}>
            <div>
              <p className={common.eyebrow}>Role directory</p>
              <h2>Access profiles</h2>
            </div>
            <span>{roles.length} roles</span>
          </div>
          <div className={styles.roleList}>
            {roles.map((role) => {
              const count = accountCount(role.name);
              const accessCount = role.permissions.filter((item) => item.level !== "No access").length;
              return (
                <button
                  key={role.id}
                  className={role.id === selected.id ? styles.selectedRole : ""}
                  onClick={() => {
                    setSelectedId(role.id);
                    setNotice("");
                  }}
                  type="button"
                >
                  <span className={styles.roleIcon}>
                    {role.type === "System" ? <ShieldCheck size={16} /> : <UsersRound size={16} />}
                  </span>
                  <span className={styles.roleCopy}>
                    <strong>{role.name}</strong>
                    <small>{role.scope}</small>
                  </span>
                  <span className={styles.roleCount}>
                    <strong>{count}</strong>
                    <small>{count === 1 ? "account" : "accounts"}</small>
                  </span>
                  <ChevronRight size={15} />
                  <span className={styles.roleAccess}>
                    {accessCount} of {role.permissions.length} modules enabled
                  </span>
                </button>
              );
            })}
          </div>
          <div className={styles.roleLegend}>
            <span>
              <span className={`${styles.legendDot} ${styles.operationalDot}`} />
              Operational role
            </span>
            <span>
              <span className={`${styles.legendDot} ${styles.systemDot}`} />
              System role
            </span>
          </div>
        </section>

        <section className={`${common.card} ${styles.permissionPanel}`}>
          <div className={styles.permissionHeader}>
            <div>
              <div className={styles.roleTitleLine}>
                <span>{selected.type}</span>
                <span>{selected.id}</span>
              </div>
              <h2>{selected.name}</h2>
              <p>{selected.description}</p>
            </div>
            <span className={styles.scopeBadge}>
              <LockKeyhole size={13} />
              {selected.scope}
            </span>
          </div>

          <div className={styles.permissionMetrics}>
            <div>
              <UsersRound size={16} />
              <span>
                <strong>{assignedAccounts}</strong> assigned accounts
              </span>
            </div>
            <div>
              <KeyRound size={16} />
              <span>
                <strong>{allowedModules}</strong> accessible modules
              </span>
            </div>
            <div>
              <ShieldCheck size={16} />
              <span>
                <strong>{managedModules}</strong> managed modules
              </span>
            </div>
            <div>
              <Eye size={16} />
              <span>
                <strong>{restrictedModules}</strong> sensitive permissions
              </span>
            </div>
          </div>

          <div className={styles.riskNotice}>
            <AlertTriangle size={15} />
            <span>{riskMessage}</span>
          </div>

          <div className={styles.matrixHeading}>
            <div>
              <h3>Module permission matrix</h3>
              <p>Choose the highest action level this role may perform in each module.</p>
            </div>
            <div className={styles.matrixLegend}>
              <span className={styles.levelView}>View</span>
              <span className={styles.levelEdit}>Create & update</span>
              <span className={styles.levelManage}>Manage</span>
            </div>
          </div>

          <div className={styles.permissionMatrix}>
            {groups.map((group) => (
              <div className={styles.permissionGroup} key={group}>
                <div className={styles.groupLabel}>{group}</div>
                {selected.permissions
                  .filter((item) => item.group === group)
                  .map((permission) => (
                    <div className={styles.permissionRow} key={permission.moduleId}>
                      <div>
                        <strong>{permission.moduleName}</strong>
                        <small>
                          {permission.sensitiveFields
                            ? "Includes separately controlled sensitive fields"
                            : "Standard module access"}
                        </small>
                      </div>
                      {permission.sensitiveFields && (
                        <span className={styles.sensitiveBadge}>
                          <LockKeyhole size={11} />
                          Sensitive
                        </span>
                      )}
                      <select
                        className={`${styles.permissionSelect} ${levelClass(permission.level)}`}
                        value={permission.level}
                        onChange={(event) =>
                          updatePermission(permission.moduleId, event.target.value as PermissionLevel)
                        }
                        aria-label={`${permission.moduleName} permission`}
                      >
                        {PERMISSION_LEVELS.map((level) => (
                          <option key={level}>{level}</option>
                        ))}
                      </select>
                    </div>
                  ))}
              </div>
            ))}
          </div>

          <div className={styles.permissionFooter}>
            <span>
              Last updated {formatDate(selected.lastUpdated)} by {selected.updatedBy}
            </span>
            <div>
              {hasChanges && (
                <span className={styles.unsaved}>
                  <span />
                  Unsaved changes
                </span>
              )}
              <button className={common.secondaryButton} disabled={!hasChanges} onClick={resetChanges} type="button">
                Discard
              </button>
              <button className={common.primaryButton} disabled={!hasChanges} onClick={saveChanges} type="button">
                <Save size={14} />
                Save permissions
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
