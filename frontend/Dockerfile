FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>uReport CRM</title></head><body><h1>uReport CRM</h1><p>API at /api/ — React frontend ships in Phase 7.</p></body></html>' \
    > /usr/share/nginx/html/index.html
EXPOSE 80
