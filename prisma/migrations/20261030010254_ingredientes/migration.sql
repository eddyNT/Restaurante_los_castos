-- AlterTable
ALTER TABLE `order_items` ADD COLUMN `removed` VARCHAR(300) NULL;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `ingredients` JSON NULL;
