import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Global,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { IsBoolean, IsIn, IsString } from 'class-validator';
import { AVATARS } from '../auth/auth.dto.js';
import { StudentId } from '../auth/auth.guard.js';
import type { ItemSlot } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RewardsService } from '../rewards/rewards.module.js';

export class EquipDto {
  @IsString()
  itemCode: string;

  @IsBoolean()
  equipped: boolean;
}

export class AvatarDto {
  @IsIn(AVATARS)
  avatar: string;
}

export type CharacterLook = { avatar: string } & Partial<Record<ItemSlot, { code: string; name: string; emoji: string }>>;

@Injectable()
export class CharacterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rewards: RewardsService,
  ) {}

  /** What the child's character currently wears. */
  async look(studentId: string): Promise<CharacterLook> {
    const [student, equipped] = await Promise.all([
      this.prisma.student.findUniqueOrThrow({ where: { id: studentId } }),
      this.prisma.studentItem.findMany({ where: { studentId, equipped: true }, include: { item: true } }),
    ]);
    const look: CharacterLook = { avatar: student.avatar };
    for (const { item } of equipped) look[item.slot] = { code: item.code, name: item.name, emoji: item.emoji };
    return look;
  }

  async shop(studentId: string) {
    const [student, items, owned] = await Promise.all([
      this.prisma.student.findUniqueOrThrow({ where: { id: studentId } }),
      this.prisma.item.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.studentItem.findMany({ where: { studentId } }),
    ]);
    const ownedBy = new Map(owned.map((o) => [o.itemId, o]));
    const worlds = await this.prisma.world.findMany({ select: { code: true, nameTh: true } });
    const worldName = new Map(worlds.map((w) => [w.code, w.nameTh]));
    return {
      coins: student.coins,
      character: await this.look(studentId),
      items: items.map((i) => ({
        code: i.code,
        name: i.name,
        slot: i.slot,
        emoji: i.emoji,
        price: i.price,
        rewardFrom: i.rewardWorldCode ? (worldName.get(i.rewardWorldCode) ?? null) : null,
        owned: ownedBy.has(i.id),
        equipped: ownedBy.get(i.id)?.equipped ?? false,
      })),
    };
  }

  async buy(studentId: string, code: string) {
    const item = await this.prisma.item.findUnique({ where: { code } });
    if (!item) throw new NotFoundException();
    if (item.price == null) throw new BadRequestException('ของชิ้นนี้ต้องได้จากการปราบบอส');
    const owned = await this.prisma.studentItem.findUnique({
      where: { studentId_itemId: { studentId, itemId: item.id } },
    });
    if (owned) throw new BadRequestException('มีของชิ้นนี้แล้ว');

    await this.prisma.$transaction(async (tx) => {
      // Conditional decrement: never lets coins go negative, even with double taps.
      const paid = await tx.student.updateMany({
        where: { id: studentId, coins: { gte: item.price! } },
        data: { coins: { decrement: item.price! } },
      });
      if (paid.count === 0) throw new BadRequestException('เหรียญยังไม่พอ เล่นด่านเพื่อสะสมเหรียญเพิ่มนะ');
      await tx.studentItem.create({ data: { studentId, itemId: item.id } });
    });
    const newAchievements = await this.rewards.evaluate(studentId);
    return { ...(await this.shop(studentId)), newAchievements };
  }

  async equip(studentId: string, dto: EquipDto) {
    const item = await this.prisma.item.findUnique({ where: { code: dto.itemCode } });
    const owned = item
      ? await this.prisma.studentItem.findUnique({ where: { studentId_itemId: { studentId, itemId: item.id } } })
      : null;
    if (!item || !owned) throw new BadRequestException('ยังไม่มีของชิ้นนี้');

    await this.prisma.$transaction([
      // One item per slot
      this.prisma.studentItem.updateMany({
        where: { studentId, equipped: true, item: { slot: item.slot } },
        data: { equipped: false },
      }),
      this.prisma.studentItem.update({
        where: { studentId_itemId: { studentId, itemId: item.id } },
        data: { equipped: dto.equipped },
      }),
    ]);
    return this.shop(studentId);
  }

  async setAvatar(studentId: string, avatar: string) {
    await this.prisma.student.update({ where: { id: studentId }, data: { avatar } });
    return this.shop(studentId);
  }

  /** Gives the world's boss collectible the first time; returns it, or null if already owned. */
  async grantWorldReward(studentId: string, worldCode: string) {
    const item = await this.prisma.item.findFirst({ where: { rewardWorldCode: worldCode } });
    if (!item) return null;
    const created = await this.prisma.studentItem.createMany({
      data: [{ studentId, itemId: item.id }],
      skipDuplicates: true,
    });
    return created.count ? { code: item.code, name: item.name, emoji: item.emoji, slot: item.slot } : null;
  }
}

@Controller()
export class CharacterController {
  constructor(private readonly character: CharacterService) {}

  @Get('character')
  look(@StudentId() studentId: string) {
    return this.character.look(studentId);
  }

  @Post('character/equip')
  equip(@StudentId() studentId: string, @Body() dto: EquipDto) {
    return this.character.equip(studentId, dto);
  }

  @Post('character/avatar')
  avatar(@StudentId() studentId: string, @Body() dto: AvatarDto) {
    return this.character.setAvatar(studentId, dto.avatar);
  }

  @Get('shop')
  shop(@StudentId() studentId: string) {
    return this.character.shop(studentId);
  }

  @Post('shop/items/:code/buy')
  buy(@StudentId() studentId: string, @Param('code') code: string) {
    return this.character.buy(studentId, code);
  }
}

@Global()
@Module({ controllers: [CharacterController], providers: [CharacterService], exports: [CharacterService] })
export class CharacterModule {}
