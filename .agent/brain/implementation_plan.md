# Systematic UX Audit & Implementation Plan: Destructive Actions (Deletions)

## Goal
To prevent accidental data loss across the entire Lidtek CRM by wrapping all destructive deletion actions in a standardized confirmation modal (`ConfirmDialog`), starting with Sprints and expanding to all modules.

## User Review Required
> [!IMPORTANT]
> The audit identified **8 different locations** where elements can be deleted without confirmation or varying degrees of protection. This plan will unify them using `ConfirmDialog.tsx`.
> Please confirm if there are any specific items you want to keep as "Insta-Delete" (e.g. maybe temporary notes or small task attachments?), or if ALL items should be explicitly protected.

## Proposed Changes

### Projects & Sprints
#### [MODIFY] `src/modules/projects/components/ProjectListView.tsx`
- **Action 1:** Delete Sprint (Line 607) - Will open Sprint confirmation dialog.
- **Action 2:** Delete Project (Line 760) - Will open Project confirmation dialog.

#### [MODIFY] `src/modules/projects/components/ProjectDetailDrawer.tsx`
- **Action:** Delete Project / Delete Interaction (Line 539).

### CRM & Leads
#### [MODIFY] `src/modules/crm/components/LeadDetailDrawer.tsx`
- **Action:** Delete Lead and Lead Interactions (Line 546).

#### [MODIFY] `src/modules/crm/components/ColumnManagerDialog.tsx`
- **Action:** Delete Funnel Column (Line 329).

### Tasks & Kanban
#### [MODIFY] `src/modules/tasks/components/TaskCard.tsx`
- **Action:** Delete Task directly from Card (Line 78).
*(Note: `TasksKanban` and `TaskEditDialog` already have `ConfirmDialog` implemented, but they will be reviewed for consistency).*

#### [MODIFY] `src/shared/components/kanban/KanbanColumn.tsx`
- **Action:** Delete Column / Items (Line 136).

### Team Management
#### [MODIFY] `src/modules/team/components/MemberDetailDrawer.tsx`
- **Action:** Delete Team Member (Revoke Access) (Line 363).

## Open Questions
- Is there any specific deletion (like simple note interactions inside a Lead) that should bypass the confirmation to stay fast, or should we blanket-apply it to 100% of Trash icons?

## Verification Plan
### Manual Verification
1. Click the Trash icon on a Sprint. Ensure a modal slides in asking "Tem certeza?".
2. Test Cancel (closes modal without deleting).
3. Test Confirm (deletes item successfully and triggers any necessary success toast/UI update).
4. Repeat for Leads, Team Members, and Projects.
