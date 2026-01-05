import express from "express";
import {
  createGroup,
  deleteGroup,
  getGroup,
  listGroups,
  updateGroup,
} from "../controller/groupController.js";
import {
  addMember,
  deleteMember,
  listMembers,
  updateMember,
} from "../controller/groupMemberController.js";
import {
  createSplit,
  getMemberSplits,
  getSplit,
  listSplits,
} from "../controller/splitController.js";
import {
  loadGroupAndCheckMembership,
  requireGroupAdminOrOwner,
} from "../middleware/groupAccessMiddleware.js";

const router = express.Router();

router.get("/groups", listGroups);
router.post("/groups", createGroup);

router.get("/groups/:groupId", loadGroupAndCheckMembership, getGroup);
router.put(
  "/groups/:groupId",
  loadGroupAndCheckMembership,
  requireGroupAdminOrOwner,
  updateGroup
);
router.delete("/groups/:groupId", loadGroupAndCheckMembership, deleteGroup);

router.get(
  "/groups/:groupId/members",
  loadGroupAndCheckMembership,
  listMembers
);
router.post(
  "/groups/:groupId/members",
  loadGroupAndCheckMembership,
  requireGroupAdminOrOwner,
  addMember
);
router.put(
  "/groups/:groupId/members/:memberId",
  loadGroupAndCheckMembership,
  requireGroupAdminOrOwner,
  updateMember
);
router.delete(
  "/groups/:groupId/members/:memberId",
  loadGroupAndCheckMembership,
  requireGroupAdminOrOwner,
  deleteMember
);

router.get("/groups/:groupId/splits", loadGroupAndCheckMembership, listSplits);
router.post(
  "/groups/:groupId/splits",
  loadGroupAndCheckMembership,
  createSplit
);
router.get(
  "/groups/:groupId/splits/:splitId",
  loadGroupAndCheckMembership,
  getSplit
);
router.get(
  "/groups/:groupId/members/:memberId/splits",
  loadGroupAndCheckMembership,
  getMemberSplits
);

export const GroupRoutes = router;
