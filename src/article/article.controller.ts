import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto, UpdateArticleDto } from './dto';

@Controller('article')
export class ArticleController {
  constructor(private readonly article: ArticleService) {}
  @Get()
  getAll(@Query('tags') tags: string) {
    return this.article.getAll(tags);
  }

  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.article.getOne(id);
  }

  @Post()
  create(@Body() articleDto: CreateArticleDto) {
    return this.article.create(articleDto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() articleDto: UpdateArticleDto,
  ) {
    return this.article.update(id, articleDto);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.article.delete(id);
  }
}
