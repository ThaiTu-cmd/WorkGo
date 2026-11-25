package com.workgo.order.reppository;
import com.workgo.order.entity.PreviewEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.*;
public interface PreviewEventRepository extends JpaRepository<PreviewEvent,UUID> {
    @Query("select e from PreviewEvent e where e.previewId=:id order by e.previewVersion")
    List<PreviewEvent> findByPreviewIdOrderByOccurredAtAsc(@Param("id") UUID id);
    boolean existsByPreviewIdAndType(UUID id,String type);
}
