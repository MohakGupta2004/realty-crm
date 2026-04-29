import { Tag } from "./tag.model";
import { Membership } from "../memberships/memberships.model";
import type { ITagCreate, ITagUpdate } from "./tag.types";

export class TagService {
  static async createTag(tagData: ITagCreate) {
    const checkWorkspace = await Membership.findOne({
      workspace: tagData.workspaceId,
      user: tagData.userId,
      isRemoved: false,
    });
    if (!checkWorkspace) {
      throw new Error("You are not a member of this workspace");
    }

    const existingTag = await Tag.findOne({
      workspaceId: tagData.workspaceId,
      userId: tagData.userId,
      name: { $regex: new RegExp(`^${tagData.name}$`, "i") },
    });

    if (existingTag) {
      throw new Error("A tag with this name already exists");
    }

    const tag = new Tag(tagData);
    return await tag.save();
  }

  static async getTags(workspaceId: string, userId: string) {
    const checkWorkspace = await Membership.findOne({
      workspace: workspaceId,
      user: userId,
      isRemoved: false,
    });
    if (!checkWorkspace) {
      throw new Error("You are not a member of this workspace");
    }

    return await Tag.find({ workspaceId, userId }).lean();
  }

  static async updateTag(tagId: string, tagData: ITagUpdate, userId: string, workspaceId: string) {
    const checkWorkspace = await Membership.findOne({
      workspace: workspaceId,
      user: userId,
      isRemoved: false,
    });
    if (!checkWorkspace) {
      throw new Error("You are not a member of this workspace");
    }

    if (tagData.name) {
      const existingTag = await Tag.findOne({
        workspaceId,
        userId,
        name: { $regex: new RegExp(`^${tagData.name}$`, "i") },
        _id: { $ne: tagId },
      });

      if (existingTag) {
        throw new Error("A tag with this name already exists");
      }
    }

    const updatedTag = await Tag.findOneAndUpdate(
      { _id: tagId, userId, workspaceId },
      tagData,
      { new: true, runValidators: true }
    ).lean();

    if (!updatedTag) {
      throw new Error("Tag not found or not authorized to update");
    }

    return updatedTag;
  }

  static async deleteTag(tagId: string, userId: string, workspaceId: string) {
    const checkWorkspace = await Membership.findOne({
      workspace: workspaceId,
      user: userId,
      isRemoved: false,
    });
    if (!checkWorkspace) {
      throw new Error("You are not a member of this workspace");
    }

    const deletedTag = await Tag.findOneAndDelete({ _id: tagId, userId, workspaceId }).lean();
    
    if (!deletedTag) {
      throw new Error("Tag not found or not authorized to delete");
    }

    // Ideally, for manual tags, we should remove the tagId from leads here.
    // That logic will be placed in the controller or a background worker, or handled by the Lead model logic lazily.

    return deletedTag;
  }
}
