import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateArticleDto, UpdateArticleDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ArticleService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(tags: string) {
    try {
      const tagArray = tags ? tags.split(',') : [];
      const articles = await this.prisma.article.findMany({
        where:
          tagArray.length > 0
            ? {
                tags: {
                  some: {
                    title: {
                      in: tagArray,
                      mode: 'insensitive',
                    },
                  },
                },
              }
            : {},
      });

      return articles;
    } catch (error) {
      throw new Error(`Could not fetch articles: ${error?.message}`);
    }
  }

  async getOne(id: number) {
    try {
      const article = await this.prisma.article.findFirst({
        where: { id },
        include: {
          tags: true,
        },
      });
      return article;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async create(createArticleDto: CreateArticleDto) {
    const { tags, ...articleData } = createArticleDto;

    try {
      // Step 1: Find existing tags
      const existingTags = await this.prisma.tag.findMany({
        where: {
          title: {
            in: tags, // Find all tags with titles in the tags array
          },
        },
      });

      // Step 2: Find titles that don't exist yet
      const existingTagTitles = existingTags.map((tag) => tag.title);
      const newTagTitles = tags.filter(
        (tag) => !existingTagTitles.includes(tag),
      );

      // Step 3: Create the new tags
      const newTags = await Promise.all(
        newTagTitles.map((title) =>
          this.prisma.tag.create({
            data: { title },
          }),
        ),
      );

      // Step 4: Combine existing and newly created tags
      const allTags = [...existingTags, ...newTags];

      // Step 5: Create the article and connect tags
      const article = await this.prisma.article.create({
        data: {
          ...articleData,
          tags: {
            connect: allTags.map((tag) => ({ id: tag.id })), // Connect tags by their IDs
          },
        },
        include: {
          tags: true,
        },
      });

      return article;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Failed to create article: ${error.message}`);
      }
      throw new Error(
        'An unexpected error occurred while creating the article',
      );
    }
  }

  async update(id: number, articleDto: UpdateArticleDto) {
    const { tags, ...articleData } = articleDto;

    // Step 1: Find the article by ID
    const article = await this.prisma.article.findFirst({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException(`Article with ID: ${id} not found`);
    }

    // Step 2: Handle tags (if provided)
    let updatedTags = [];
    if (tags) {
      // Find existing tags in the database
      const existingTags = await this.prisma.tag.findMany({
        where: {
          title: {
            in: tags, // Find all tags with titles in the tags array
          },
        },
      });

      // Separate new tags from existing tags
      const existingTagTitles = existingTags.map((tag) => tag.title);
      const newTagTitles = tags.filter(
        (tag) => !existingTagTitles.includes(tag),
      );

      // Create the new tags
      const newTags = await Promise.all(
        newTagTitles.map((title) =>
          this.prisma.tag.create({
            data: { title },
          }),
        ),
      );

      // Combine existing and newly created tags
      updatedTags = [...existingTags, ...newTags];
    }

    // Step 3: Update the article
    const updatedArticle = await this.prisma.article.update({
      where: { id },
      data: {
        ...articleData,
        tags: {
          set: [], // Clear existing tags if needed
          connect: updatedTags.map((tag) => ({ id: tag.id })), // Connect tags by their IDs
        },
      },
      include: {
        tags: true, // Include the tags in the response
      },
    });

    return updatedArticle;
  }

  async delete(id: number) {
    await this.prisma.article.delete({
      where: { id },
    });

    return { messsage: `Article with ID: ${id} was deleted` };
  }
}
