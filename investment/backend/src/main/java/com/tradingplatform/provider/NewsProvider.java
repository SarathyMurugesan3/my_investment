package com.tradingplatform.provider;

import com.tradingplatform.model.News;
import java.util.List;

public interface NewsProvider {
    List<News> getLatestNews();
}
