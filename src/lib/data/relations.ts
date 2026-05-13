import { productRelations } from "@/data/mock/product-relations";
import type { ProductRelation, RelationType } from "@/types/commerce";

export function getProductRelations(): ProductRelation[] {
  return productRelations;
}

export function getProductRelationById(relationId: string): ProductRelation | undefined {
  return productRelations.find((relation) => relation.id === relationId);
}

export function getRelationsByProductId(productId: string): ProductRelation[] {
  return productRelations.filter(
    (relation) => relation.sourceProductId === productId || relation.relatedProductId === productId,
  );
}

export function getOutgoingRelationsByProductId(productId: string): ProductRelation[] {
  return productRelations.filter((relation) => relation.sourceProductId === productId);
}

export function getIncomingRelationsByProductId(productId: string): ProductRelation[] {
  return productRelations.filter((relation) => relation.relatedProductId === productId);
}

export function getRelationsByType(type: RelationType): ProductRelation[] {
  return productRelations.filter((relation) => relation.type === type);
}

export function getRelationsByProductIdAndType(
  productId: string,
  type: RelationType,
): ProductRelation[] {
  return getRelationsByProductId(productId).filter((relation) => relation.type === type);
}
